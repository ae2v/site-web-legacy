import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { requireBureauActor } from "@/lib/server/auth";
import { createOpaqueToken } from "@/lib/opaque-token";
import { normalizeEmailCategories } from "@/lib/server-functions/email-preferences";
import type { DemoOrder, DemoTicket } from "@/lib/demo-session";

export type BureauServerMember = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  departement: string;
  niveau: string;
  schoolYear: string;
  membershipStatus: string;
  contributionStatus: string;
  contributionCents: number;
  memberSince: string | null;
  cardCode: string;
  role: string;
  pole: string | null;
  poles: string[];
  roleTitle: string | null;
  emailPrefs: string[];
  emailUnsubscribed: boolean;
  dossier: {
    id: string;
    schoolYear: string;
    birthDate: string | null;
    phone: string | null;
    studentId: string | null;
    groupe: string | null;
    interests: string[];
    volunteer: string | null;
    message: string | null;
    imageRight: boolean;
    submittedAt: string;
    validatedAt: string | null;
    notes: string | null;
    rgpdAcceptedAt: string | null;
    statutsAcceptedAt: string | null;
    emailPreferenceToken: string | null;
    emailUnsubscribed: boolean;
  } | null;
  memberships: {
    schoolYear: string;
    status: string;
    contributionStatus: string;
    amountCents: number;
  }[];
  payments: { id: string; amountCents: number; status: string; kind: string; createdAt: string }[];
  orderCount: number;
  invoiceCount: number;
  ticketCount: number;
  tickets: DemoTicket[];
  orders: DemoOrder[];
};

export const getBureauMembersServer = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        schoolYear: z
          .string()
          .regex(/^\d{4}-\d{4}$/)
          .optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const [users, dossiers] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...(data?.schoolYear ? { schoolYear: data.schoolYear } : {}),
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          departement: true,
          niveau: true,
          schoolYear: true,
          membershipStatus: true,
          contributionStatus: true,
          contributionCents: true,
          memberSince: true,
          cardCode: true,
          role: true,
          pole: true,
          roleTitle: true,
          emailPrefs: true,
          emailUnsubscribedAt: true,
          memberships: {
            orderBy: { schoolYear: "desc" },
            select: { schoolYear: true, status: true, contributionStatus: true, amountCents: true },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            select: { id: true, amountCents: true, status: true, kind: true, createdAt: true },
          },
          _count: { select: { orders: true, invoices: true, tickets: true } },
        },
      }),
      prisma.dossier.findMany({
        ...(data?.schoolYear ? { where: { schoolYear: data.schoolYear } } : {}),
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          departement: true,
          niveau: true,
          status: true,
          contributionStatus: true,
          contributionCents: true,
          schoolYear: true,
          emailPrefsJson: true,
          birthDate: true,
          phone: true,
          studentId: true,
          groupe: true,
          interestsJson: true,
          volunteer: true,
          message: true,
          imageRight: true,
          rgpdAcceptedAt: true,
          statutsAcceptedAt: true,
          emailPreferenceToken: true,
          emailUnsubscribedAt: true,
          submittedAt: true,
          validatedAt: true,
          notes: true,
        },
      }),
    ]);
    const dossierByEmail = new Map(
      dossiers.map((dossier) => [dossier.email.trim().toLowerCase(), dossier]),
    );
    const parseList = (value: string): string[] => {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        return [];
      }
    };
    const mapDossier = (dossier: (typeof dossiers)[number] | undefined) =>
      dossier
        ? {
            id: dossier.id,
            schoolYear: dossier.schoolYear,
            birthDate: dossier.birthDate,
            phone: dossier.phone,
            studentId: dossier.studentId,
            groupe: dossier.groupe,
            interests: parseList(dossier.interestsJson),
            volunteer: dossier.volunteer,
            message: dossier.message,
            imageRight: dossier.imageRight,
            submittedAt: dossier.submittedAt,
            validatedAt: dossier.validatedAt,
            notes: dossier.notes,
            rgpdAcceptedAt: dossier.rgpdAcceptedAt?.toISOString() ?? null,
            statutsAcceptedAt: dossier.statutsAcceptedAt?.toISOString() ?? null,
            emailPreferenceToken: dossier.emailPreferenceToken,
            emailUnsubscribed: Boolean(dossier.emailUnsubscribedAt),
          }
        : null;
    const mapUser = (user: (typeof users)[number]): BureauServerMember => ({
      id: user.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      departement: user.departement,
      niveau: user.niveau,
      schoolYear: user.schoolYear,
      membershipStatus: user.membershipStatus,
      contributionStatus: user.contributionStatus,
      contributionCents: user.contributionCents,
      memberSince: user.memberSince,
      cardCode: user.cardCode,
      role: user.role,
      pole: user.pole,
      poles: user.pole ? [user.pole] : [],
      roleTitle: user.roleTitle,
      emailPrefs: normalizeEmailCategories(user.emailPrefs, Boolean(user.emailUnsubscribedAt)),
      emailUnsubscribed: Boolean(user.emailUnsubscribedAt),
      dossier: mapDossier(dossierByEmail.get(user.email.trim().toLowerCase())),
      memberships: user.memberships,
      payments: user.payments.map((payment) => ({
        ...payment,
        createdAt: payment.createdAt.toISOString(),
      })),
      orderCount: user._count.orders,
      invoiceCount: user._count.invoices,
      ticketCount: user._count.tickets,
      tickets: [],
      orders: [],
    });
    const knownEmails = new Set(users.map((user) => user.email.trim().toLowerCase()));
    return [
      ...users.map(mapUser),
      ...dossiers
        .filter((dossier) => !knownEmails.has(dossier.email.trim().toLowerCase()))
        .map((dossier) => ({
          id: dossier.id,
          userId: null,
          firstName: dossier.firstName,
          lastName: dossier.lastName,
          email: dossier.email,
          departement: dossier.departement,
          niveau: dossier.niveau,
          schoolYear: dossier.schoolYear,
          membershipStatus: dossier.status,
          contributionStatus: dossier.contributionStatus,
          contributionCents: dossier.contributionCents,
          memberSince: null,
          cardCode: "",
          role: "MEMBRE",
          pole: null,
          poles: [],
          roleTitle: null,
          emailPrefs: normalizeEmailCategories(
            parseList(dossier.emailPrefsJson),
            Boolean(dossier.emailUnsubscribedAt),
          ),
          emailUnsubscribed: Boolean(dossier.emailUnsubscribedAt),
          dossier: mapDossier(dossier),
          memberships: [],
          payments: [],
          orderCount: 0,
          invoiceCount: 0,
          ticketCount: 0,
          tickets: [],
          orders: [],
        })),
    ] satisfies BureauServerMember[];
  });

export type BureauPerson360 = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departement: string;
  niveau: string;
  schoolYear: string;
  membershipStatus: string;
  contributionStatus: string;
  contributionCents: number;
  cardCode: string;
  memberSince: string | null;
  role: string;
  pole: string | null;
  roleTitle: string | null;
  teamMember: {
    id: string;
    roleTitle: string;
    roleTitles: string[];
    officerRole: string | null;
    poles: string[];
    showDefaultPoleTitles: boolean;
    pole: string | null;
    secondaryPoles: string[];
    isOfficer: boolean;
    photoUrl: string | null;
    mandateYear: string;
    personalAe2vEmail: string | null;
    roleEmail: string | null;
  } | null;
  emailPrefs: string[];
  emailUnsubscribed: boolean;
  emailPreferenceToken: string | null;
  dossier: {
    id: string;
    schoolYear: string;
    birthDate: string | null;
    phone: string | null;
    studentId: string | null;
    departement: string;
    niveau: string;
    groupe: string | null;
    interests: string[];
    volunteer: string | null;
    message: string | null;
    imageRight: boolean;
    status: string;
    contributionStatus: string;
    contributionCents: number;
    submittedAt: string;
    validatedAt: string | null;
    notes: string | null;
    rgpdAcceptedAt: string | null;
    statutsAcceptedAt: string | null;
    emailPreferenceToken: string | null;
    emailUnsubscribed: boolean;
  } | null;
  memberships: {
    id: string;
    schoolYear: string;
    status: string;
    contributionStatus: string;
    amountCents: number;
  }[];
  payments: {
    id: string;
    amountCents: number;
    status: string;
    kind: string;
    paymentMethod: string | null;
    invoiceId: string | null;
    refundedAmountCents: number;
    createdAt: string;
  }[];
  orders: {
    id: string;
    date: string;
    totalCents: number;
    status: string;
    helloAssoId: string | null;
    lines: { productName: string; quantity: number; unitPriceCents: number }[];
  }[];
  invoices: {
    id: string;
    date: string;
    totalCents: number;
    status: string;
    description: string;
    paymentMethod: string;
    lines: {
      description: string;
      qty: number;
      unitPriceCents: number;
      totalCents: number;
    }[];
  }[];
  messages: {
    id: string;
    sujet: string;
    message: string;
    status: string;
    sentAt: string;
    createdAt: string;
  }[];
  tickets: {
    id: string;
    code: string;
    status: string;
    tier: string;
    priceCents: number;
    eventTitle: string;
    eventDate: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    details: string;
    author: string;
    timestamp: string;
  }[];
};

export const getPerson360Server = createServerFn({ method: "GET" })
  .validator(z.object({ personId: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const person = await getPrisma().user.findUnique({
      where: { id: data.personId },
      include: {
        memberships: { orderBy: { schoolYear: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        tickets: { include: { event: true }, orderBy: { createdAt: "desc" } },
        orders: { include: { lines: true }, orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        teamMember: true,
      },
    });
    if (!person) {
      const dossier = await getPrisma().dossier.findUnique({ where: { id: data.personId } });
      if (!dossier) throw new Response("Membre introuvable", { status: 404 });
      const dossierEmailPreferenceToken =
        dossier.emailPreferenceToken ??
        (
          await getPrisma().dossier.update({
            where: { id: dossier.id },
            data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
            select: { emailPreferenceToken: true },
          })
        ).emailPreferenceToken;
      const messages = await getPrisma().contactMessage.findMany({
        where: { email: dossier.email },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const parseDossierList = (value: string): string[] => {
        try {
          const parsed: unknown = JSON.parse(value);
          return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : [];
        } catch {
          return [];
        }
      };
      return {
        id: dossier.id,
        firstName: dossier.firstName,
        lastName: dossier.lastName,
        email: dossier.email,
        departement: dossier.departement,
        niveau: dossier.niveau,
        schoolYear: dossier.schoolYear,
        membershipStatus: dossier.status,
        contributionStatus: dossier.contributionStatus,
        contributionCents: dossier.contributionCents,
        cardCode: "",
        memberSince: null,
        role: "MEMBRE",
        pole: null,
        roleTitle: null,
        emailPrefs: normalizeEmailCategories(
          parseDossierList(dossier.emailPrefsJson),
          Boolean(dossier.emailUnsubscribedAt),
        ),
        emailUnsubscribed: Boolean(dossier.emailUnsubscribedAt),
        emailPreferenceToken: dossierEmailPreferenceToken,
        teamMember: null,
        dossier: {
          id: dossier.id,
          schoolYear: dossier.schoolYear,
          birthDate: dossier.birthDate,
          phone: dossier.phone,
          studentId: dossier.studentId,
          departement: dossier.departement,
          niveau: dossier.niveau,
          groupe: dossier.groupe,
          interests: parseDossierList(dossier.interestsJson),
          volunteer: dossier.volunteer,
          message: dossier.message,
          imageRight: dossier.imageRight,
          status: dossier.status,
          contributionStatus: dossier.contributionStatus,
          contributionCents: dossier.contributionCents,
          submittedAt: dossier.submittedAt,
          validatedAt: dossier.validatedAt,
          notes: dossier.notes,
          rgpdAcceptedAt: dossier.rgpdAcceptedAt?.toISOString() ?? null,
          statutsAcceptedAt: dossier.statutsAcceptedAt?.toISOString() ?? null,
          emailPreferenceToken: dossierEmailPreferenceToken,
          emailUnsubscribed: Boolean(dossier.emailUnsubscribedAt),
        },
        memberships: [],
        payments: [],
        orders: [],
        invoices: [],
        messages: messages.map((message) => ({
          id: message.id,
          sujet: message.sujet,
          message: message.message,
          status: message.status,
          sentAt: message.sentAt,
          createdAt: message.createdAt.toISOString(),
        })),
        tickets: [],
        auditLogs: [],
      } satisfies BureauPerson360;
    }
    const dossier = await getPrisma().dossier.findFirst({
      where: { email: { equals: person.email, mode: "insensitive" } },
    });
    const dossierEmailPreferenceToken = dossier
      ? (dossier.emailPreferenceToken ??
        (
          await getPrisma().dossier.update({
            where: { id: dossier.id },
            data: { emailPreferenceToken: createOpaqueToken("AE2V-EMAIL-") },
            select: { emailPreferenceToken: true },
          })
        ).emailPreferenceToken)
      : null;
    const auditLogs = await getPrisma().auditLog.findMany({
      where: {
        OR: [{ details: { contains: person.id } }, { details: { contains: person.email } }],
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    const messages = await getPrisma().contactMessage.findMany({
      where: { email: person.email },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    function parseList(value: string): string[] {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        return [];
      }
    }
    return {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      departement: person.departement,
      niveau: person.niveau,
      schoolYear: person.schoolYear,
      membershipStatus: person.membershipStatus,
      contributionStatus: person.contributionStatus,
      contributionCents: person.contributionCents,
      cardCode: person.cardCode,
      memberSince: person.memberSince,
      role: person.role,
      pole: person.pole,
      roleTitle: person.roleTitle,
      teamMember: person.teamMember
        ? {
            id: person.teamMember.id,
            roleTitle: person.teamMember.roleTitle,
            roleTitles: (() => {
              try {
                const parsed: unknown = JSON.parse(person.teamMember.roleTitlesJson);
                return Array.isArray(parsed)
                  ? parsed.filter((item): item is string => typeof item === "string")
                  : [person.teamMember.roleTitle];
              } catch {
                return [person.teamMember.roleTitle];
              }
            })(),
            officerRole: person.teamMember.officerRole,
            poles: (() => {
              try {
                const parsed: unknown = JSON.parse(person.teamMember.polesJson);
                if (Array.isArray(parsed))
                  return parsed.filter((item): item is string => typeof item === "string");
              } catch {
                // Legacy rows use pole + secondaryPolesJson.
              }
              return [
                person.teamMember.pole,
                ...parseList(person.teamMember.secondaryPolesJson),
              ].filter(
                (item, index, values): item is string =>
                  Boolean(item) && values.indexOf(item) === index,
              );
            })(),
            showDefaultPoleTitles: person.teamMember.showDefaultPoleTitles,
            pole: person.teamMember.pole,
            secondaryPoles: parseList(person.teamMember.secondaryPolesJson),
            isOfficer: person.teamMember.isOfficer,
            photoUrl: person.teamMember.photoUrl,
            mandateYear: person.teamMember.mandateYear,
            personalAe2vEmail: person.teamMember.personalAe2vEmail,
            roleEmail: person.teamMember.roleEmail,
          }
        : null,
      emailPrefs: normalizeEmailCategories(person.emailPrefs, Boolean(person.emailUnsubscribedAt)),
      emailUnsubscribed: Boolean(person.emailUnsubscribedAt),
      emailPreferenceToken: person.emailPreferenceToken,
      dossier: dossier
        ? {
            id: dossier.id,
            schoolYear: dossier.schoolYear,
            birthDate: dossier.birthDate,
            phone: dossier.phone,
            studentId: dossier.studentId,
            departement: dossier.departement,
            niveau: dossier.niveau,
            groupe: dossier.groupe,
            interests: parseList(dossier.interestsJson),
            volunteer: dossier.volunteer,
            message: dossier.message,
            imageRight: dossier.imageRight,
            status: dossier.status,
            contributionStatus: dossier.contributionStatus,
            contributionCents: dossier.contributionCents,
            submittedAt: dossier.submittedAt,
            validatedAt: dossier.validatedAt,
            notes: dossier.notes,
            rgpdAcceptedAt: dossier.rgpdAcceptedAt?.toISOString() ?? null,
            statutsAcceptedAt: dossier.statutsAcceptedAt?.toISOString() ?? null,
            emailPreferenceToken: dossierEmailPreferenceToken,
            emailUnsubscribed: Boolean(dossier.emailUnsubscribedAt),
          }
        : null,
      memberships: person.memberships.map((membership) => ({
        id: membership.id,
        schoolYear: membership.schoolYear,
        status: membership.status,
        contributionStatus: membership.contributionStatus,
        amountCents: membership.amountCents,
      })),
      payments: person.payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        status: payment.status,
        kind: payment.kind,
        paymentMethod: payment.paymentMethod,
        invoiceId: payment.invoiceId,
        refundedAmountCents: payment.refundedAmountCents ?? 0,
        createdAt: payment.createdAt.toLocaleDateString("fr-FR"),
      })),
      orders: person.orders.map((order) => ({
        id: order.id,
        date: order.date,
        totalCents: order.totalCents,
        status: order.status,
        helloAssoId: order.helloAssoId,
        lines: order.lines.map((line) => ({
          productName: line.productName,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      })),
      invoices: person.invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        totalCents: invoice.priceCents,
        status: invoice.status,
        description: invoice.description,
        paymentMethod: invoice.paymentMethod,
        lines: (() => {
          try {
            const parsed: unknown = JSON.parse(invoice.linesJson);
            return Array.isArray(parsed)
              ? parsed
                  .filter(
                    (line): line is Record<string, unknown> =>
                      typeof line === "object" &&
                      line !== null &&
                      typeof line["description"] === "string",
                  )
                  .map((line) => {
                    const qty = typeof line["qty"] === "number" ? line["qty"] : 1;
                    const unitPriceCents =
                      typeof line["unitPriceCents"] === "number"
                        ? line["unitPriceCents"]
                        : invoice.priceCents;
                    return {
                      description: String(line["description"]),
                      qty,
                      unitPriceCents,
                      totalCents:
                        typeof line["totalCents"] === "number"
                          ? line["totalCents"]
                          : qty * unitPriceCents,
                    };
                  })
              : [];
          } catch {
            return [];
          }
        })(),
      })),
      messages: messages.map((message) => ({
        id: message.id,
        sujet: message.sujet,
        message: message.message,
        status: message.status,
        sentAt: message.sentAt,
        createdAt: message.createdAt.toISOString(),
      })),
      tickets: person.tickets.map((ticket) => ({
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        tier: ticket.tier,
        priceCents: ticket.priceCents,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
      })),
      auditLogs: auditLogs.map((entry) => ({
        id: entry.id,
        action: entry.action,
        details: entry.details,
        author: entry.author,
        timestamp: entry.timestamp.toLocaleString("fr-FR"),
      })),
    } satisfies BureauPerson360;
  });

export const updatePersonProfileServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      personId: z.string().min(1).max(100),
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      birthDate: z.string().trim().max(20).nullable().optional(),
      phone: z.string().trim().max(40).nullable().optional(),
      studentId: z.string().trim().max(40).nullable().optional(),
      schoolYear: z
        .string()
        .regex(/^20\d{2}-20\d{2}$/)
        .optional(),
      departement: z.string().trim().min(1).max(120).optional(),
      niveau: z.string().trim().min(1).max(80).optional(),
      groupe: z.string().trim().max(40).nullable().optional(),
      interests: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
      volunteer: z.string().trim().max(40).nullable().optional(),
      message: z.string().trim().max(1000).nullable().optional(),
      imageRight: z.boolean().optional(),
      notes: z.string().trim().max(2000).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: data.personId },
      select: { id: true, email: true },
    });
    const dossier = user
      ? await prisma.dossier.findUnique({ where: { email: user.email }, select: { id: true } })
      : await prisma.dossier.findUnique({ where: { id: data.personId }, select: { id: true } });
    if (!user && !dossier) throw new Response("Personne introuvable", { status: 404 });
    await prisma.$transaction(async (tx) => {
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
            ...(data.departement !== undefined ? { departement: data.departement } : {}),
            ...(data.niveau !== undefined ? { niveau: data.niveau } : {}),
            ...(data.schoolYear !== undefined ? { schoolYear: data.schoolYear } : {}),
          },
        });
      }
      if (dossier) {
        await tx.dossier.update({
          where: { id: dossier.id },
          data: {
            ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
            ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
            ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.studentId !== undefined ? { studentId: data.studentId } : {}),
            ...(data.departement !== undefined ? { departement: data.departement } : {}),
            ...(data.niveau !== undefined ? { niveau: data.niveau } : {}),
            ...(data.schoolYear !== undefined ? { schoolYear: data.schoolYear } : {}),
            ...(data.groupe !== undefined ? { groupe: data.groupe } : {}),
            ...(data.interests !== undefined
              ? { interestsJson: JSON.stringify(data.interests) }
              : {}),
            ...(data.volunteer !== undefined ? { volunteer: data.volunteer } : {}),
            ...(data.message !== undefined ? { message: data.message } : {}),
            ...(data.imageRight !== undefined ? { imageRight: data.imageRight } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "PERSON_PROFILE_UPDATED",
          details: `${data.personId} · champs administratifs`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
    });
    return { ok: true as const };
  });

export const updatePaymentStatusServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      paymentId: z.string().min(1).max(100),
      status: z.enum(["EN_ATTENTE", "CONFIRME", "ANNULE", "REMBOURSE", "PARTIELLEMENT_REMBOURSE"]),
      refundAmountCents: z.number().int().positive().optional(),
      paymentMethod: z.string().trim().min(1).max(60).optional(),
      notes: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("finance");
    const prisma = getPrisma();
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, schoolYear: true },
        },
        order: { include: { lines: true } },
        event: { select: { title: true } },
        registration: {
          select: { participantName: true, userEmail: true },
        },
      },
    });
    if (!payment) throw new Response("Paiement introuvable", { status: 404 });
    if (payment.status === "CONFIRME" && ["EN_ATTENTE", "ANNULE"].includes(data.status)) {
      throw new Response("Un paiement confirmé doit être remboursé avant de quitter l’état payé.", {
        status: 409,
      });
    }
    if (payment.status === "ANNULE" && data.status !== "ANNULE") {
      throw new Response("Un paiement annulé ne peut pas être réactivé.", { status: 409 });
    }
    if (payment.status === "REMBOURSE" && data.status !== "REMBOURSE") {
      throw new Response("Un remboursement enregistré ne peut pas être annulé", { status: 409 });
    }
    if (
      payment.status === "PARTIELLEMENT_REMBOURSE" &&
      !["PARTIELLEMENT_REMBOURSE", "REMBOURSE"].includes(data.status)
    ) {
      throw new Response("Un remboursement partiel ne peut pas revenir à un état antérieur", {
        status: 409,
      });
    }
    const alreadyRefundedCents = payment.refundedAmountCents ?? 0;
    const remainingRefundableCents = payment.amountCents - alreadyRefundedCents;
    if (data.status === "PARTIELLEMENT_REMBOURSE") {
      if (
        !data.refundAmountCents ||
        data.refundAmountCents <= 0 ||
        data.refundAmountCents >= remainingRefundableCents
      ) {
        throw new Response("Le montant du remboursement partiel est invalide", { status: 422 });
      }
    }
    if (data.status === "REMBOURSE") {
      if (remainingRefundableCents <= 0) {
        throw new Response("Ce paiement est déjà totalement remboursé", { status: 409 });
      }
      if (
        data.refundAmountCents !== undefined &&
        data.refundAmountCents !== remainingRefundableCents
      ) {
        throw new Response("Le remboursement total doit couvrir le solde restant", {
          status: 422,
        });
      }
    }
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      let invoiceId = payment.invoiceId;
      let createdInvoiceId: string | null = null;
      const refundIncrementCents =
        data.status === "REMBOURSE"
          ? remainingRefundableCents
          : data.status === "PARTIELLEMENT_REMBOURSE"
            ? (data.refundAmountCents ?? 0)
            : 0;
      const refundedAmountCents =
        data.status === "REMBOURSE"
          ? payment.amountCents
          : data.status === "PARTIELLEMENT_REMBOURSE"
            ? alreadyRefundedCents + refundIncrementCents
            : undefined;
      if (data.status === "CONFIRME" && !invoiceId) {
        const customerName = payment.user
          ? `${payment.user.firstName} ${payment.user.lastName}`
          : (payment.registration?.participantName ?? payment.order?.customerName ?? "Client AE2V");
        const customerEmail =
          payment.user?.email ?? payment.registration?.userEmail ?? payment.order?.userEmail;
        if (!customerEmail)
          throw new Response("Le paiement n'est rattaché à aucun e-mail", { status: 422 });
        const description = payment.order
          ? `Commande HelloAsso ${payment.order.id}`
          : payment.event
            ? `Inscription — ${payment.event.title}`
            : payment.kind;
        const lines = payment.order?.lines.length
          ? payment.order.lines.map((line) => ({
              description: `${line.productName}${line.variant ? ` — ${line.variant}` : ""}`,
              qty: line.quantity,
              unitPriceCents: line.unitPriceCents,
              totalCents: line.quantity * line.unitPriceCents,
            }))
          : [
              {
                description,
                qty: 1,
                unitPriceCents: payment.amountCents,
                totalCents: payment.amountCents,
              },
            ];
        const invoice = await tx.invoice.create({
          data: {
            ...(payment.userId ? { userId: payment.userId } : {}),
            ...(payment.orderId ? { orderId: payment.orderId } : {}),
            customerName,
            customerEmail,
            paymentMethod:
              data.paymentMethod ?? payment.paymentMethod ?? payment.provider ?? "À préciser",
            priceCents: payment.amountCents,
            description,
            linesJson: JSON.stringify(lines),
            date: new Date().toLocaleDateString("fr-FR"),
          },
        });
        const claimed = await tx.payment.updateMany({
          where: { id: payment.id, invoiceId: null },
          data: { invoiceId: invoice.id },
        });
        if (claimed.count === 1) {
          invoiceId = invoice.id;
          createdInvoiceId = invoice.id;
          await tx.auditLog.create({
            data: {
              action: "INVOICE_AUTO_CREATED",
              details: `${invoice.id} · paiement ${payment.id}`,
              author: `${actor.firstName} ${actor.lastName}`,
            },
          });
        } else {
          await tx.invoice.delete({ where: { id: invoice.id } });
          invoiceId =
            (
              await tx.payment.findUnique({
                where: { id: payment.id },
                select: { invoiceId: true },
              })
            )?.invoiceId ?? null;
        }
      }
      const next = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: data.status,
          ...(invoiceId && !createdInvoiceId ? { invoiceId } : {}),
          ...(refundedAmountCents !== undefined ? { refundedAmountCents } : {}),
          ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status === "CONFIRME" ? { confirmedAt: now } : {}),
          ...(data.status === "REMBOURSE" || data.status === "PARTIELLEMENT_REMBOURSE"
            ? { refundedAt: now }
            : {}),
        },
      });
      if (payment.orderId && data.status === "CONFIRME") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAYEE" } });
      }
      if (invoiceId && (data.status === "REMBOURSE" || data.status === "PARTIELLEMENT_REMBOURSE")) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: data.status === "REMBOURSE" ? "REMBOURSEE" : "PARTIELLEMENT_REMBOURSEE",
            ...(data.notes ? { notes: data.notes } : {}),
          },
        });
      }
      if (payment.eventId && data.status === "CONFIRME") {
        await tx.ticket.updateMany({
          where: {
            eventId: payment.eventId,
            ...(payment.registrationId
              ? { registrationId: payment.registrationId }
              : { userId: payment.userId }),
            status: "en_attente_paiement",
          },
          data: { status: "valide" },
        });
      }
      if (
        payment.eventId &&
        ["REMBOURSE", "PARTIELLEMENT_REMBOURSE", "ANNULE"].includes(data.status)
      ) {
        await tx.ticket.updateMany({
          where: {
            eventId: payment.eventId,
            ...(payment.registrationId
              ? { registrationId: payment.registrationId }
              : { userId: payment.userId }),
          },
          data: { status: "annule" },
        });
      }
      if (
        payment.userId &&
        data.status === "CONFIRME" &&
        /COTISATION|ADHESION/i.test(payment.kind)
      ) {
        await tx.user.update({
          where: { id: payment.userId },
          data: { contributionStatus: "PAYEE", contributionCents: payment.amountCents },
        });
        await tx.membership.updateMany({
          where: {
            userId: payment.userId,
            schoolYear: payment.user?.schoolYear ?? "2026-2027",
          },
          data: { contributionStatus: "PAYEE", amountCents: payment.amountCents, validatedAt: now },
        });
      }
      if (
        payment.userId &&
        /COTISATION|ADHESION/i.test(payment.kind) &&
        ["REMBOURSE", "PARTIELLEMENT_REMBOURSE"].includes(data.status)
      ) {
        const partial = data.status === "PARTIELLEMENT_REMBOURSE";
        const nextContributionStatus = partial ? "PAIEMENT_EN_ATTENTE" : "NON_COTISANT";
        const remainingContributionCents = partial
          ? payment.amountCents - (refundedAmountCents ?? alreadyRefundedCents)
          : 0;
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            contributionStatus: nextContributionStatus,
            contributionCents: remainingContributionCents,
          },
        });
        await tx.membership.updateMany({
          where: {
            userId: payment.userId,
            schoolYear: payment.user?.schoolYear ?? "2026-2027",
          },
          data: {
            contributionStatus: nextContributionStatus,
            amountCents: remainingContributionCents,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_STATUS_CHANGED",
          details: `${payment.id}: ${payment.status} → ${data.status}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return next;
    });
    return { ok: true as const, payment: updated };
  });
