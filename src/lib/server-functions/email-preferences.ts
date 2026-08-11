import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { createOpaqueToken } from "@/lib/opaque-token";
import { deliverEmail } from "@/lib/server/email-delivery";
import { getServerActor, requireBureauActor } from "@/lib/server/auth";

export const EMAIL_CATEGORIES = [
  "ADHESION",
  "EVENEMENTS",
  "BOUTIQUE",
  "BDE",
  "INFORMATIONS_GENERALES",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

const categorySchema = z.enum(EMAIL_CATEGORIES);
const preferencesSchema = z.object({
  categories: z.array(categorySchema).max(EMAIL_CATEGORIES.length),
  unsubscribeAll: z.boolean().optional(),
});

export function normalizeEmailCategories(values: string[], unsubscribed: boolean): EmailCategory[] {
  if (unsubscribed) return [];
  const aliases: Record<string, EmailCategory> = {
    ADHESION: "ADHESION",
    ÉVÉNEMENTS: "EVENEMENTS",
    EVENEMENTS: "EVENEMENTS",
    "ÉVÉNEMENTS & SOIRÉES": "EVENEMENTS",
    "BILLETTERIE & RAPPELS": "EVENEMENTS",
    BOUTIQUE: "BOUTIQUE",
    "BOUTIQUE & PRÉCOMMANDES": "BOUTIQUE",
    PARTENARIATS: "BDE",
    "PARTENARIATS & BONS PLANS": "BDE",
    "VIE DU BUREAU": "BDE",
    "VIE DU BUREAU & VOTES": "BDE",
    "RECRUTEMENT DE BÉNÉVOLES": "BDE",
    BDE: "BDE",
    INFORMATIONS_GENERALES: "INFORMATIONS_GENERALES",
    "INFORMATIONS GÉNÉRALES": "INFORMATIONS_GENERALES",
  };
  return Array.from(
    new Set(
      values
        .map((value) => aliases[value.trim().toUpperCase()])
        .filter((value): value is EmailCategory => Boolean(value)),
    ),
  );
}

async function getMember() {
  const actor = await getServerActor();
  if (!actor) throw new Response("Connexion requise", { status: 401 });
  return actor;
}

export type EmailPreferencesSnapshot = {
  categories: EmailCategory[];
  unsubscribed: boolean;
  token: string;
};

export const getEmailPreferencesServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailPreferencesSnapshot> => {
    const actor = await getMember();
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { emailPrefs: true, emailUnsubscribedAt: true, emailPreferenceToken: true },
    });
    if (!user) throw new Response("Compte introuvable", { status: 404 });
    const token =
      user.emailPreferenceToken ??
      (
        await prisma.user.update({
          where: { id: actor.id },
          data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
          select: { emailPreferenceToken: true },
        })
      ).emailPreferenceToken;
    if (!token) throw new Error("Impossible de créer le lien de préférences.");
    return {
      categories: normalizeEmailCategories(user.emailPrefs, Boolean(user.emailUnsubscribedAt)),
      unsubscribed: Boolean(user.emailUnsubscribedAt),
      token,
    };
  },
);

export const updateEmailPreferencesServer = createServerFn({ method: "POST" })
  .validator(preferencesSchema)
  .handler(async ({ data }): Promise<EmailPreferencesSnapshot> => {
    const actor = await getMember();
    const prisma = getPrisma();
    const unsubscribed = data.unsubscribeAll === true;
    const categories = normalizeEmailCategories(data.categories, unsubscribed);
    const existing = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { emailPreferenceToken: true },
    });
    if (!existing) throw new Response("Compte introuvable", { status: 404 });
    const user = await prisma.user.update({
      where: { id: actor.id },
      data: {
        emailPrefs: categories,
        emailUnsubscribedAt: unsubscribed ? new Date() : null,
        emailPreferenceToken: existing.emailPreferenceToken ?? createOpaqueToken("AE2V-EMAIL-"),
      },
      select: { emailPreferenceToken: true },
    });
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_PREFERENCES_UPDATED",
        details: `${actor.email} · ${unsubscribed ? "désinscription globale" : categories.join(",")}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    if (!user.emailPreferenceToken) throw new Error("Token de préférences absent.");
    return { categories, unsubscribed, token: user.emailPreferenceToken };
  });

export const updatePersonEmailPreferencesServer = createServerFn({ method: "POST" })
  .validator(
    preferencesSchema.extend({
      personId: z.string().trim().min(1).max(100),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true; snapshot: EmailPreferencesSnapshot }> => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({
      where: { id: data.personId },
      select: { id: true, email: true, emailPreferenceToken: true },
    });
    const unsubscribed = data.unsubscribeAll === true;
    const categories = normalizeEmailCategories(data.categories, unsubscribed);
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          emailPrefs: categories,
          emailUnsubscribedAt: unsubscribed ? new Date() : null,
          emailPreferenceToken: existing.emailPreferenceToken ?? createOpaqueToken("AE2V-EMAIL-"),
        },
        select: { emailPreferenceToken: true },
      });
      if (!updated.emailPreferenceToken) throw new Error("Token de préférences absent.");
      await prisma.auditLog.create({
        data: {
          action: "EMAIL_PREFERENCES_ADMIN_UPDATED",
          details: `${existing.email} · ${unsubscribed ? "désinscription globale" : categories.join(",")}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return {
        ok: true as const,
        snapshot: { categories, unsubscribed, token: updated.emailPreferenceToken },
      };
    }

    const dossier = await prisma.dossier.findUnique({
      where: { id: data.personId },
      select: { id: true, email: true, emailPreferenceToken: true },
    });
    if (!dossier) throw new Response("Personne introuvable", { status: 404 });
    const updated = await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        emailPrefsJson: JSON.stringify(categories),
        emailUnsubscribedAt: unsubscribed ? new Date() : null,
        emailPreferenceToken: dossier.emailPreferenceToken ?? createOpaqueToken("AE2V-EMAIL-"),
      },
      select: { emailPreferenceToken: true },
    });
    if (!updated.emailPreferenceToken) throw new Error("Token de préférences absent.");
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_PREFERENCES_ADMIN_UPDATED",
        details: `${dossier.email} · ${unsubscribed ? "désinscription globale" : categories.join(",")}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return {
      ok: true as const,
      snapshot: { categories, unsubscribed, token: updated.emailPreferenceToken },
    };
  });

export const unsubscribeEmailServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().trim().min(12).max(200),
      category: categorySchema.optional(),
    }),
  )
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { emailPreferenceToken: data.token },
      select: { id: true, email: true, emailPrefs: true, emailUnsubscribedAt: true },
    });
    const dossier = user
      ? null
      : await prisma.dossier.findUnique({
          where: { emailPreferenceToken: data.token },
          select: { id: true, email: true, emailPrefsJson: true, emailUnsubscribedAt: true },
        });
    if (!user && !dossier)
      throw new Response("Lien de désinscription invalide ou expiré", { status: 404 });
    let dossierCategories: string[] = [];
    if (dossier) {
      try {
        const parsed: unknown = JSON.parse(dossier.emailPrefsJson);
        dossierCategories = Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        dossierCategories = [];
      }
    }
    const categories = data.category
      ? normalizeEmailCategories(user ? user.emailPrefs : dossierCategories, false).filter(
          (item) => item !== data.category,
        )
      : [];
    const global = !data.category;
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailPrefs: categories,
          emailUnsubscribedAt: global ? new Date() : null,
        },
      });
    } else if (dossier) {
      await prisma.dossier.update({
        where: { id: dossier.id },
        data: {
          emailPrefsJson: JSON.stringify(categories),
          emailUnsubscribedAt: global ? new Date() : null,
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        action: data.category ? "EMAIL_CATEGORY_UNSUBSCRIBED" : "EMAIL_UNSUBSCRIBED",
        details: `${user?.email ?? dossier?.email}${data.category ? ` · ${data.category}` : " · toutes les catégories"}`,
        author: "Lien de désinscription",
      },
    });
    return { ok: true as const, category: data.category ?? null };
  });

export const getEmailUnsubscribeLinkServer = createServerFn({ method: "GET" })
  .validator(
    z.object({
      email: z.string().trim().email().max(254),
      category: categorySchema.optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true, emailPreferenceToken: true },
    });
    const dossier = user
      ? null
      : await prisma.dossier.findUnique({
          where: { email: data.email.toLowerCase() },
          select: { id: true, emailPreferenceToken: true },
        });
    if (!user && !dossier) return { link: null as string | null };
    const token = user
      ? (user.emailPreferenceToken ??
        (
          await prisma.user.update({
            where: { id: user.id },
            data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
            select: { emailPreferenceToken: true },
          })
        ).emailPreferenceToken)
      : (dossier?.emailPreferenceToken ??
        (
          await prisma.dossier.update({
            where: { id: dossier!.id },
            data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
            select: { emailPreferenceToken: true },
          })
        ).emailPreferenceToken);
    const baseUrl = process.env["PUBLIC_SITE_URL"] ?? "https://bde-velizy.fr";
    return {
      link: token
        ? `${baseUrl}/email/desinscription/${token}${data.category ? `?category=${encodeURIComponent(data.category)}` : ""}`
        : null,
    };
  });

const sendCategorySchema = z.enum([...EMAIL_CATEGORIES, "TRANSACTIONNEL"] as const);

export const sendEmailServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      recipient: z.string().trim().email().max(254),
      sender: z.string().trim().email(),
      subject: z.string().trim().min(1).max(240),
      body: z.string().trim().min(1).max(50_000),
      category: sendCategorySchema.default("BDE"),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    if (data.sender.toLowerCase() !== actor.email.toLowerCase()) {
      throw new Response("L’expéditeur doit être l’adresse du compte Bureau connecté", {
        status: 403,
      });
    }
    const recipient = data.recipient.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: recipient },
      select: { id: true, emailPrefs: true, emailUnsubscribedAt: true, emailPreferenceToken: true },
    });
    const dossier = user
      ? null
      : await prisma.dossier.findUnique({
          where: { email: recipient },
          select: {
            id: true,
            emailPrefsJson: true,
            emailUnsubscribedAt: true,
            emailPreferenceToken: true,
          },
        });
    let dossierPrefs: string[] = [];
    if (dossier) {
      try {
        const parsed: unknown = JSON.parse(dossier.emailPrefsJson);
        dossierPrefs = Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        dossierPrefs = [];
      }
    }
    if ((user || dossier) && data.category !== "TRANSACTIONNEL") {
      const categories = normalizeEmailCategories(
        user ? user.emailPrefs : dossierPrefs,
        Boolean(user?.emailUnsubscribedAt ?? dossier?.emailUnsubscribedAt),
      );
      if (!categories.includes(data.category)) {
        return { ok: false as const, error: "Le destinataire n’a pas activé cette catégorie." };
      }
    }
    let body = data.body;
    if ((user || dossier) && data.category !== "TRANSACTIONNEL") {
      const token = user
        ? (user.emailPreferenceToken ??
          (
            await prisma.user.update({
              where: { id: user.id },
              data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
              select: { emailPreferenceToken: true },
            })
          ).emailPreferenceToken)
        : (dossier?.emailPreferenceToken ??
          (
            await prisma.dossier.update({
              where: { id: dossier!.id },
              data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
              select: { emailPreferenceToken: true },
            })
          ).emailPreferenceToken);
      const baseUrl = process.env["PUBLIC_SITE_URL"] ?? "https://bde-velizy.fr";
      if (token) {
        body += `\n\n—\nDésactiver cette catégorie ou gérer mes préférences : ${baseUrl}/email/desinscription/${token}?category=${encodeURIComponent(data.category)}`;
      }
    }
    const delivery = await deliverEmail({
      recipient,
      sender: data.sender.toLowerCase(),
      subject: data.subject,
      body,
    });
    const log = await prisma.emailLog.create({
      data: {
        ...(user ? { userId: user.id } : {}),
        recipient,
        sender: data.sender.toLowerCase(),
        subject: data.subject,
        body,
        category: data.category,
        status: delivery.status,
        ...(delivery.error ? { error: delivery.error } : {}),
        sentAt: delivery.status === "ENVOYE" ? new Date() : null,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_LOGGED",
        details: `${log.id} · ${recipient} · ${data.category}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return {
      ok: true as const,
      id: log.id,
      deliveryStatus: delivery.status,
      deliveryError: delivery.error,
      timestamp: log.sentAt?.toISOString() ?? new Date().toISOString(),
    };
  });

export type BureauEmailListRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolYear: string;
  membershipStatus: string;
  categories: EmailCategory[];
  unsubscribed: boolean;
  source: "USER" | "DOSSIER";
  volunteer: string | null;
};

export const getBureauEmailListsServer = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: categorySchema.optional(),
        membershipStatus: z
          .enum(["DEMANDE_SOUMISE", "A_CORRIGER", "MEMBRE_VALIDE", "REFUSE"])
          .optional(),
        departement: z.string().trim().max(120).optional(),
        niveau: z.string().trim().max(80).optional(),
        schoolYear: z
          .string()
          .regex(/^\d{4}-\d{4}$/)
          .optional(),
        volunteer: z.enum(["oui", "peut-etre", "non"]).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<BureauEmailListRow[]> => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const [users, dossiers] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...(data?.schoolYear ? { schoolYear: data.schoolYear } : {}),
          ...(data?.membershipStatus ? { membershipStatus: data.membershipStatus } : {}),
          ...(data?.departement ? { departement: data.departement } : {}),
          ...(data?.niveau ? { niveau: data.niveau } : {}),
        },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          schoolYear: true,
          membershipStatus: true,
          emailPrefs: true,
          emailUnsubscribedAt: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      prisma.dossier.findMany({
        where: {
          ...(data?.schoolYear ? { schoolYear: data.schoolYear } : {}),
          ...(data?.membershipStatus ? { status: data.membershipStatus } : {}),
          ...(data?.departement ? { departement: data.departement } : {}),
          ...(data?.niveau ? { niveau: data.niveau } : {}),
        },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          schoolYear: true,
          emailPrefsJson: true,
          emailUnsubscribedAt: true,
          volunteer: true,
          submittedAt: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);
    const rows = new Map<string, BureauEmailListRow>();
    const dossierByEmail = new Map(
      dossiers.map((dossier) => [dossier.email.trim().toLowerCase(), dossier]),
    );
    for (const user of users) {
      const unsubscribed = Boolean(user.emailUnsubscribedAt);
      const optedInCategories = normalizeEmailCategories(user.emailPrefs, false);
      const categories = normalizeEmailCategories(user.emailPrefs, unsubscribed);
      const rowKey = user.email.trim().toLowerCase();
      const relatedDossier = dossierByEmail.get(rowKey);
      if (optedInCategories.length === 0 && !unsubscribed) continue;
      // Un listing exploitable pour une diffusion ne doit jamais réinclure une
      // personne ayant demandé sa désinscription globale.
      if (unsubscribed) continue;
      if (data?.category && !categories.includes(data.category)) continue;
      if (data?.volunteer && relatedDossier?.volunteer !== data.volunteer) continue;
      rows.set(rowKey, {
        id: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolYear: user.schoolYear,
        membershipStatus: user.membershipStatus,
        categories,
        unsubscribed,
        source: "USER",
        volunteer: relatedDossier?.volunteer ?? null,
      });
    }
    for (const dossier of dossiers) {
      const rowKey = dossier.email.trim().toLowerCase();
      if (rows.has(rowKey)) continue;
      let parsed: string[] = [];
      try {
        const value: unknown = JSON.parse(dossier.emailPrefsJson);
        if (Array.isArray(value))
          parsed = value.filter((item): item is string => typeof item === "string");
      } catch {
        parsed = [];
      }
      const unsubscribed = Boolean(dossier.emailUnsubscribedAt);
      const categories = normalizeEmailCategories(parsed, unsubscribed);
      if (unsubscribed) continue;
      if (parsed.length === 0 && !unsubscribed) continue;
      if (data?.category && !categories.includes(data.category)) continue;
      if (data?.volunteer && dossier.volunteer !== data.volunteer) continue;
      rows.set(rowKey, {
        id: dossier.email,
        email: dossier.email,
        firstName: dossier.firstName,
        lastName: dossier.lastName,
        schoolYear: dossier.schoolYear,
        membershipStatus: dossier.status,
        categories,
        unsubscribed,
        source: "DOSSIER",
        volunteer: dossier.volunteer,
      });
    }
    return [...rows.values()];
  });
