import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { requireBureauActor } from "@/lib/server/auth";
import { createOpaqueToken } from "@/lib/opaque-token";
import { deliverEmail } from "@/lib/server/email-delivery";

const submissionSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  studentId: z.string().trim().min(6).max(12),
  departement: z.string().trim().min(1).max(80),
  niveau: z.string().trim().min(1).max(40),
  groupe: z.string().trim().max(12).optional(),
  // La cotisation est facultative ; dès qu’un montant est saisi, le minimum
  // légal/métier demandé par le bureau est de 3 €.
  cotisationCents: z
    .number()
    .int()
    .min(0)
    .max(50_000)
    .superRefine((value, context) => {
      if (value > 0 && value < 300) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La cotisation libre doit être d’au moins 3 €.",
        });
      }
    }),
  interests: z.array(z.string().trim().min(1).max(80)).max(8),
  volunteer: z.enum(["oui", "peut-etre", "non"]),
  message: z.string().trim().max(500).optional(),
  emailPrefs: z.array(z.string().trim().min(1).max(100)).max(8),
  imageRight: z.boolean(),
  schoolYear: z.string().regex(/^20\d{2}-20\d{2}$/),
});

function parseEmailPrefs(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export const submitMembershipServer = createServerFn({ method: "POST" })
  .validator(submissionSchema)
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const email = data.email.toLowerCase();
    const existing = await prisma.dossier.findUnique({ where: { email } });
    if (existing) {
      throw new Response("Une demande existe déjà pour cette adresse e-mail.", { status: 409 });
    }

    const now = new Date();
    const dossier = await prisma.dossier.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone || null,
        studentId: data.studentId,
        departement: data.departement,
        niveau: data.niveau,
        ...(data.groupe ? { groupe: data.groupe } : {}),
        interestsJson: JSON.stringify(data.interests),
        volunteer: data.volunteer,
        ...(data.message ? { message: data.message } : {}),
        emailPrefsJson: JSON.stringify(data.emailPrefs),
        emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-"),
        schoolYear: data.schoolYear,
        rgpdAcceptedAt: now,
        statutsAcceptedAt: now,
        imageRight: data.imageRight,
        status: "DEMANDE_SOUMISE",
        contributionStatus: data.cotisationCents > 0 ? "PAIEMENT_EN_ATTENTE" : "NON_COTISANT",
        contributionCents: data.cotisationCents,
        submittedAt: now.toLocaleDateString("fr-FR"),
      },
    });
    return { ok: true as const, dossierId: dossier.id };
  });

export const decideMembershipServer = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        dossierId: z.string().min(1).max(100),
        decision: z.enum(["MEMBRE_VALIDE", "A_CORRIGER", "REFUSE"]),
        note: z.string().trim().max(1000).optional(),
      })
      .superRefine((value, context) => {
        if (value.decision !== "MEMBRE_VALIDE" && !value.note?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["note"],
            message: "Un motif est requis pour une correction ou un refus.",
          });
        }
      }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const dossier = await prisma.dossier.findUnique({ where: { id: data.dossierId } });
    if (!dossier) throw new Response("Dossier introuvable", { status: 404 });

    const now = new Date();
    const validatedAt = now.toLocaleDateString("fr-FR");
    let correctionEmail: {
      recipient: string;
      sender: string;
      subject: string;
      body: string;
    } | null = null;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.dossier.update({
        where: { id: dossier.id },
        data: {
          status: data.decision,
          ...(data.note !== undefined ? { notes: data.note } : {}),
          ...(data.decision === "A_CORRIGER"
            ? {
                correctionToken: createOpaqueToken("AE2V-CORR-"),
                correctionRequestedAt: now,
              }
            : {}),
          ...(data.decision === "MEMBRE_VALIDE" ? { validatedAt } : {}),
        },
      });

      if (data.decision === "A_CORRIGER" && data.note?.trim()) {
        await tx.membershipCorrection.create({
          data: {
            dossierId: dossier.id,
            authorType: "BUREAU",
            authorName: `${actor.firstName} ${actor.lastName}`,
            authorEmail: actor.email,
            message: data.note.trim(),
          },
        });
        const baseUrl = process.env["PUBLIC_SITE_URL"] ?? "https://bde-velizy.fr";
        const token = (
          await tx.dossier.findUnique({
            where: { id: dossier.id },
            select: { correctionToken: true },
          })
        )?.correctionToken;
        if (token) {
          correctionEmail = {
            recipient: dossier.email,
            sender: actor.email,
            subject: "Votre demande d’adhésion AE2V doit être corrigée",
            body: `Bonjour ${dossier.firstName},\n\n${data.note.trim()}\n\nRépondre à la demande : ${baseUrl}/adhesion/correction/${token}`,
          };
        }
      }

      if (data.decision === "MEMBRE_VALIDE") {
        const user = await tx.user.upsert({
          where: { email: dossier.email },
          update: {
            firstName: dossier.firstName,
            lastName: dossier.lastName,
            phone: dossier.phone,
            studentId: dossier.studentId,
            groupe: dossier.groupe,
            interestsJson: dossier.interestsJson,
            volunteer: dossier.volunteer,
            message: dossier.message,
            rgpdAcceptedAt: dossier.rgpdAcceptedAt,
            statutsAcceptedAt: dossier.statutsAcceptedAt,
            departement: dossier.departement,
            niveau: dossier.niveau,
            membershipStatus: "MEMBRE_VALIDE",
            contributionStatus:
              dossier.contributionStatus === "PAIEMENT_EN_ATTENTE"
                ? "PAIEMENT_EN_ATTENTE"
                : "NON_COTISANT",
            contributionCents: dossier.contributionCents,
            schoolYear: dossier.schoolYear,
            emailPrefs: parseEmailPrefs(dossier.emailPrefsJson),
            validatedAt,
            memberSince: validatedAt,
          },
          create: {
            email: dossier.email,
            firstName: dossier.firstName,
            lastName: dossier.lastName,
            phone: dossier.phone,
            studentId: dossier.studentId,
            groupe: dossier.groupe,
            interestsJson: dossier.interestsJson,
            volunteer: dossier.volunteer,
            message: dossier.message,
            rgpdAcceptedAt: dossier.rgpdAcceptedAt,
            statutsAcceptedAt: dossier.statutsAcceptedAt,
            departement: dossier.departement,
            niveau: dossier.niveau,
            membershipStatus: "MEMBRE_VALIDE",
            contributionStatus:
              dossier.contributionStatus === "PAIEMENT_EN_ATTENTE"
                ? "PAIEMENT_EN_ATTENTE"
                : "NON_COTISANT",
            contributionCents: dossier.contributionCents,
            schoolYear: dossier.schoolYear,
            cardCode: createOpaqueToken("AE2V-2026-USR-"),
            memberSince: validatedAt,
            validatedAt,
            emailPrefs: parseEmailPrefs(dossier.emailPrefsJson),
          },
        });

        await tx.membership.upsert({
          where: { userId_schoolYear: { userId: user.id, schoolYear: dossier.schoolYear } },
          update: {
            status: "MEMBRE_VALIDE",
            contributionStatus: user.contributionStatus,
            amountCents: dossier.contributionCents,
            validatedAt: now,
          },
          create: {
            userId: user.id,
            schoolYear: dossier.schoolYear,
            status: "MEMBRE_VALIDE",
            contributionStatus: user.contributionStatus,
            amountCents: dossier.contributionCents,
            validatedAt: now,
          },
        });
        if (dossier.contributionCents > 0) {
          const existingPayment = await tx.payment.findFirst({
            where: {
              userId: user.id,
              kind: "COTISATION_ADHESION",
              status: { in: ["EN_ATTENTE", "CONFIRME"] },
            },
            select: { id: true },
          });
          if (!existingPayment) {
            await tx.payment.create({
              data: {
                userId: user.id,
                amountCents: dossier.contributionCents,
                status: "EN_ATTENTE",
                kind: "COTISATION_ADHESION",
                paymentMethod: "À préciser",
              },
            });
          }
        }
      } else {
        const existingUser = await tx.user.findUnique({
          where: { email: dossier.email },
          select: { id: true },
        });
        if (existingUser) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { membershipStatus: data.decision },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "MEMBERSHIP_DECISION",
          details: `${dossier.id}: ${dossier.status} → ${data.decision}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return updated;
    });
    let correctionDelivery: { status: string; error?: string } | null = null;
    const emailToSend = correctionEmail as {
      recipient: string;
      sender: string;
      subject: string;
      body: string;
    } | null;
    if (emailToSend) {
      correctionDelivery = await deliverEmail(emailToSend);
      await prisma.emailLog.create({
        data: {
          recipient: emailToSend.recipient,
          sender: emailToSend.sender,
          subject: emailToSend.subject,
          body: emailToSend.body,
          category: "TRANSACTIONNEL",
          status: correctionDelivery.status,
          ...(correctionDelivery.error ? { error: correctionDelivery.error } : {}),
          sentAt: correctionDelivery.status === "ENVOYE" ? new Date() : null,
        },
      });
    }
    const linkedUser =
      data.decision === "MEMBRE_VALIDE"
        ? await prisma.user.findUnique({ where: { email: dossier.email }, select: { id: true } })
        : null;
    return {
      ok: true as const,
      dossier: result,
      userId: linkedUser?.id ?? null,
      correctionDelivery,
    };
  });

export type MembershipCorrectionThread = {
  dossierId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  messages: {
    id: string;
    authorType: string;
    authorName: string;
    message: string;
    createdAt: string;
  }[];
};

export const getMembershipCorrectionByDossierServer = createServerFn({ method: "GET" })
  .validator(z.object({ dossierId: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }): Promise<MembershipCorrectionThread | null> => {
    await requireBureauActor("read");
    const dossier = await getPrisma().dossier.findUnique({
      where: { id: data.dossierId },
      include: { corrections: { orderBy: { createdAt: "asc" } } },
    });
    if (!dossier) return null;
    return {
      dossierId: dossier.id,
      firstName: dossier.firstName,
      lastName: dossier.lastName,
      email: dossier.email,
      status: dossier.status,
      messages: dossier.corrections.map((message) => ({
        id: message.id,
        authorType: message.authorType,
        authorName: message.authorName,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  });

export const getMembershipCorrectionServer = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().trim().min(10).max(160) }))
  .handler(async ({ data }): Promise<MembershipCorrectionThread | null> => {
    const dossier = await getPrisma().dossier.findUnique({
      where: { correctionToken: data.token },
      include: { corrections: { orderBy: { createdAt: "asc" } } },
    });
    if (!dossier) return null;
    return {
      dossierId: dossier.id,
      firstName: dossier.firstName,
      lastName: dossier.lastName,
      email: dossier.email,
      status: dossier.status,
      messages: dossier.corrections.map((message) => ({
        id: message.id,
        authorType: message.authorType,
        authorName: message.authorName,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  });

export const submitMembershipCorrectionServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().trim().min(10).max(160),
      message: z.string().trim().min(2).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const dossier = await prisma.dossier.findUnique({
      where: { correctionToken: data.token },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!dossier) throw new Response("Lien de correction invalide ou expiré", { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.dossier.update({
        where: { id: dossier.id },
        data: { status: "DEMANDE_SOUMISE", correctionRequestedAt: null, notes: data.message },
      });
      await tx.membershipCorrection.create({
        data: {
          dossierId: dossier.id,
          authorType: "ADHERENT",
          authorName: `${dossier.firstName} ${dossier.lastName}`,
          authorEmail: dossier.email,
          message: data.message,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "MEMBERSHIP_CORRECTION_RECEIVED",
          details: `${dossier.id} · réponse adhérent`,
          author: `${dossier.firstName} ${dossier.lastName}`,
        },
      });
    });
    return { ok: true as const };
  });
