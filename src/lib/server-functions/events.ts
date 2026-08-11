import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { getServerActor, requireBureauActor } from "@/lib/server/auth";
import { createOpaqueToken } from "@/lib/opaque-token";
import {
  normalizeEventTiers,
  type EventCustomSection,
  type EventProgramStep,
  type EventTier,
} from "@/data/events";

const eventStatus = z.enum(["NON_PUBLIE", "OUVERT", "COMPLET", "BIENTOT", "TERMINE"]);

/** Les anciennes fiches utilisent DD/MM/YYYY, les nouvelles peuvent fournir une date ISO. */
function parseRegistrationBoundary(
  value: string | null | undefined,
  endOfDay = false,
): Date | null {
  const normalized = value?.trim() ?? "";
  if (!normalized || /^à\s+déterminer$/i.test(normalized)) return null;
  const frenchDate = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (frenchDate) {
    const [, day, month, year] = frenchDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1) return null;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTiers(value: string): EventTier[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const mapped = parsed
      .filter(
        (tier): tier is Record<string, unknown> =>
          typeof tier === "object" && tier !== null && typeof tier["id"] === "string",
      )
      .map((tier) => {
        const audience: EventTier["audience"] =
          tier["audience"] === "adherent" ||
          tier["audience"] === "bureau" ||
          tier["audience"] === "public"
            ? tier["audience"]
            : "public";
        const systemLabel =
          audience === "public"
            ? "Tarif public"
            : audience === "adherent"
              ? "Tarif cotisant"
              : audience === "bureau"
                ? "Tarif membre du bureau"
                : null;
        return {
          id: String(tier["id"]),
          label:
            systemLabel ?? (typeof tier["label"] === "string" ? tier["label"] : String(tier["id"])),
          priceCents:
            typeof tier["priceCents"] === "number" && Number.isInteger(tier["priceCents"])
              ? tier["priceCents"]
              : 0,
          audience,
          ...(typeof tier["note"] === "string" ? { note: tier["note"] } : {}),
          ...(tier["disabled"] === true ? { disabled: true } : {}),
          ...(tier["isMandatory"] === true ? { isMandatory: true } : {}),
          ...(tier["system"] === true ? { system: true } : {}),
        };
      });
    return normalizeEventTiers(mapped);
  } catch {
    return [];
  }
}

function parseJsonArray<T>(value: string, fallback: T[] = []): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTiers(input: Record<string, unknown>[]): EventTier[] {
  const system = [
    { id: "public", label: "Tarif public", audience: "public" as const },
    { id: "adherent", label: "Tarif cotisant", audience: "adherent" as const },
    { id: "bureau", label: "Tarif membre du bureau", audience: "bureau" as const },
  ];
  const cleaned = input
    .filter((tier) => tier["audience"] !== "membre")
    .map((tier) => ({
      id: typeof tier["id"] === "string" ? tier["id"] : createOpaqueToken("tier").slice(0, 16),
      label: typeof tier["label"] === "string" ? tier["label"] : "Tarif personnalisé",
      priceCents:
        typeof tier["priceCents"] === "number" && Number.isInteger(tier["priceCents"])
          ? Math.max(0, tier["priceCents"])
          : 0,
      audience:
        tier["audience"] === "adherent" ||
        tier["audience"] === "bureau" ||
        tier["audience"] === "public"
          ? tier["audience"]
          : "public",
      ...(typeof tier["note"] === "string" && tier["note"].trim()
        ? { note: tier["note"].trim() }
        : {}),
      disabled: tier["disabled"] === true,
      isMandatory: tier["isMandatory"] === true,
      system: tier["system"] === true,
    })) as EventTier[];
  const requiredTiers: EventTier[] = system.map((base) => {
    const existing = cleaned.find((tier) => tier.id === base.id || tier.audience === base.audience);
    return {
      ...base,
      priceCents: existing?.priceCents ?? 0,
      disabled: existing?.disabled ?? false,
      isMandatory: true,
      system: true,
      ...(existing?.note ? { note: existing.note } : {}),
    };
  });
  return [
    ...requiredTiers,
    ...cleaned.filter((tier) => !system.some((base) => base.id === tier.id)),
  ];
}

function serializeEvent(event: {
  id: string;
  title: string;
  slug: string;
  kind: string;
  date: string;
  doors: string;
  place: string;
  address: string;
  summary: string;
  capacity: number;
  registered: number;
  status: "NON_PUBLIE" | "OUVERT" | "COMPLET" | "BIENTOT" | "TERMINE";
  waitlist: boolean;
  description: string;
  image: string | null;
  registrationOpensAt: string | null;
  programJson: string;
  access: string;
  practicalJson: string;
  customSectionsJson: string;
  tiersJson: string;
  registrationClosesAt: string;
}) {
  return {
    id: event.id,
    serverId: event.id,
    title: event.title,
    slug: event.slug,
    kind: event.kind,
    date: event.date,
    doors: event.doors,
    place: event.place,
    address: event.address,
    summary: event.summary,
    capacity: event.capacity,
    registered: event.registered,
    status: event.status,
    waitlist: event.waitlist,
    description: event.description,
    image: event.image,
    registrationOpensAt: event.registrationOpensAt,
    program: parseJsonArray<EventProgramStep>(event.programJson),
    access: event.access,
    practical: parseJsonArray<string>(event.practicalJson),
    customSections: parseJsonArray<EventCustomSection>(event.customSectionsJson),
    tiers: parseTiers(event.tiersJson),
    registrationClosesAt: event.registrationClosesAt,
  };
}

export const getPublicEventsServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const events = await getPrisma().event.findMany({
      where: { status: { not: "NON_PUBLIE" } },
      orderBy: { createdAt: "desc" },
    });
    return events.map(serializeEvent);
  } catch {
    return [];
  }
});

export const getBureauEventsServer = createServerFn({ method: "GET" }).handler(async () => {
  await requireBureauActor("read");
  const events = await getPrisma().event.findMany({ orderBy: { createdAt: "desc" } });
  return events.map(serializeEvent);
});

export const getPublicEventServer = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(180) }))
  .handler(async ({ data }) => {
    try {
      const event = await getPrisma().event.findFirst({
        where: { slug: data.slug, status: { not: "NON_PUBLIE" } },
      });
      return event ? serializeEvent(event) : null;
    } catch {
      return null;
    }
  });

export const saveEventServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      eventId: z.string().min(1).max(100),
      title: z.string().trim().min(2).max(160),
      slug: z.string().trim().min(2).max(180),
      kind: z.string().trim().min(1).max(60),
      date: z.string().trim().min(1).max(80),
      doors: z.string().trim().min(1).max(80),
      place: z.string().trim().min(1).max(160),
      address: z.string().trim().min(1).max(240),
      summary: z.string().trim().min(1).max(1000),
      capacity: z.number().int().positive().max(100_000),
      registered: z.number().int().min(0).max(100_000),
      status: eventStatus,
      waitlist: z.boolean(),
      description: z.string().trim().max(3000),
      image: z.string().trim().max(500).optional(),
      registrationOpensAt: z.string().trim().max(80).optional(),
      registrationClosesAt: z.string().trim().min(1).max(80),
      program: z
        .array(
          z.object({
            time: z.string().max(40),
            label: z.string().max(160),
            detail: z.string().max(500).optional(),
          }),
        )
        .max(50)
        .optional(),
      access: z.string().trim().max(2000).optional(),
      practical: z.array(z.string().trim().max(500)).max(30).optional(),
      customSections: z
        .array(
          z.object({ title: z.string().trim().min(1).max(100), body: z.string().trim().max(3000) }),
        )
        .max(20)
        .optional(),
      tiers: z.array(z.record(z.string(), z.unknown())).max(20),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const normalizedTiers = normalizeTiers(data.tiers);
    const publicTier = normalizedTiers.find((tier) => tier.audience === "public");
    const memberTier = normalizedTiers.find((tier) => tier.audience === "adherent");
    const price = (tier: Record<string, unknown> | undefined) =>
      typeof tier?.["priceCents"] === "number" && Number.isInteger(tier["priceCents"])
        ? tier["priceCents"]
        : 0;

    const existing = await prisma.event.findFirst({ where: { slug: data.slug } });
    const registered = existing
      ? await prisma.eventRegistration.count({
          where: { eventId: existing.id, status: "CONFIRMEE" },
        })
      : 0;
    const event = existing
      ? await prisma.event.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            kind: data.kind,
            date: data.date,
            doors: data.doors,
            place: data.place,
            address: data.address,
            summary: data.summary,
            capacity: Math.max(data.capacity, registered),
            registered,
            status: data.status,
            waitlist: data.waitlist,
            description: data.description,
            image: data.image?.trim() || null,
            registrationOpensAt: data.registrationOpensAt?.trim() || null,
            registrationClosesAt: data.registrationClosesAt,
            programJson: JSON.stringify(data.program ?? []),
            access: data.access ?? "",
            practicalJson: JSON.stringify(data.practical ?? []),
            customSectionsJson: JSON.stringify(data.customSections ?? []),
            tiersJson: JSON.stringify(normalizedTiers),
            pricePublicCents: price(publicTier),
            priceMemberCents: price(memberTier),
          },
        })
      : await prisma.event.create({
          data: {
            title: data.title,
            slug: data.slug,
            kind: data.kind,
            date: data.date,
            doors: data.doors,
            place: data.place,
            address: data.address,
            summary: data.summary,
            capacity: Math.max(data.capacity, registered),
            registered,
            status: data.status,
            waitlist: data.waitlist,
            description: data.description,
            image: data.image?.trim() || null,
            registrationOpensAt: data.registrationOpensAt?.trim() || null,
            registrationClosesAt: data.registrationClosesAt,
            programJson: JSON.stringify(data.program ?? []),
            access: data.access ?? "",
            practicalJson: JSON.stringify(data.practical ?? []),
            customSectionsJson: JSON.stringify(data.customSections ?? []),
            tiersJson: JSON.stringify(normalizedTiers),
            pricePublicCents: price(publicTier),
            priceMemberCents: price(memberTier),
          },
        });

    await prisma.auditLog.create({
      data: {
        action: "EVENT_SAVED",
        details: `${event.id} · ${event.title}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return { ok: true as const, event };
  });

export const registerEventServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      eventSlug: z.string().trim().min(1).max(180),
      tierId: z.string().trim().min(1).max(80),
      participantName: z.string().trim().min(2).max(120).optional(),
      participantEmail: z.string().trim().email().max(255).optional(),
      participantPhone: z.string().trim().max(40).optional(),
      legalConsent: z.boolean().optional(),
      termsConsent: z.boolean().optional(),
      imageConsent: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getServerActor();
    const participantEmail = (actor?.email ?? data.participantEmail ?? "").toLowerCase();
    const participantName = actor
      ? `${actor.firstName} ${actor.lastName}`
      : (data.participantName?.trim() ?? "");
    if (
      !participantEmail ||
      !participantName ||
      data.legalConsent !== true ||
      data.termsConsent !== true
    ) {
      throw new Response("Nom, e-mail et acceptation des conditions requis pour l'inscription", {
        status: 422,
      });
    }
    const prisma = getPrisma();
    const event = await prisma.event.findUnique({ where: { slug: data.eventSlug } });
    if (!event) throw new Response("Événement introuvable", { status: 404 });
    if (event.status !== "OUVERT" && !(event.status === "COMPLET" && event.waitlist))
      throw new Response("Les inscriptions sont fermées", { status: 409 });
    const now = new Date();
    const registrationOpensAt = parseRegistrationBoundary(event.registrationOpensAt);
    const registrationClosesAt = parseRegistrationBoundary(event.registrationClosesAt, true);
    if (registrationOpensAt && now < registrationOpensAt)
      throw new Response("Les inscriptions ne sont pas encore ouvertes", { status: 409 });
    if (registrationClosesAt && now > registrationClosesAt)
      throw new Response("Les inscriptions sont terminées", { status: 409 });

    let tiers: Record<string, unknown>[] = [];
    try {
      const parsed: unknown = JSON.parse(event.tiersJson);
      if (Array.isArray(parsed))
        tiers = parsed.filter(
          (tier): tier is Record<string, unknown> => typeof tier === "object" && tier !== null,
        );
    } catch {
      tiers = [];
    }
    const tier = tiers.find((candidate) => candidate["id"] === data.tierId);
    if (!tier) throw new Response("Tarif introuvable", { status: 422 });
    if (tier["disabled"] === true)
      throw new Response("Ce tarif n’est plus disponible", { status: 409 });
    const tierAudience = tier["audience"];
    if (
      tierAudience === "bureau" &&
      (!actor || !["BUREAU", "TRESORIER", "PRESIDENT"].includes(actor.role))
    ) {
      throw new Response("Ce tarif est réservé aux membres du bureau", { status: 403 });
    }
    if (tierAudience === "adherent") {
      if (!actor)
        throw new Response("Connectez-vous pour utiliser le tarif cotisant", { status: 403 });
      const eligible = await prisma.user.findUnique({
        where: { id: actor.id },
        select: { contributionStatus: true },
      });
      if (eligible?.contributionStatus !== "PAYEE") {
        throw new Response("Le tarif cotisant nécessite une cotisation confirmée", { status: 403 });
      }
    }
    const priceCents =
      typeof tier["priceCents"] === "number" && Number.isInteger(tier["priceCents"])
        ? tier["priceCents"]
        : 0;
    const label = typeof tier["label"] === "string" ? tier["label"] : data.tierId;
    const duplicate = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        ...(actor ? { userId: actor.id } : { userEmail: participantEmail }),
        status: { not: "ANNULEE" },
      },
      select: { id: true },
    });
    if (duplicate)
      throw new Response("Une inscription existe déjà pour cet événement", { status: 409 });

    const result = await prisma.$transaction(async (tx) => {
      const capacityUpdate = await tx.event.updateMany({
        where: { id: event.id, registered: { lt: event.capacity } },
        data: { registered: { increment: 1 } },
      });
      const waitlisted = capacityUpdate.count !== 1;
      if (waitlisted && !event.waitlist) throw new Response("Événement complet", { status: 409 });
      if (!waitlisted && event.registered + 1 >= event.capacity) {
        await tx.event.update({ where: { id: event.id }, data: { status: "COMPLET" } });
      }
      const registration = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          ...(actor ? { userId: actor.id } : {}),
          userEmail: participantEmail,
          participantName,
          participantPhone: data.participantPhone ?? null,
          legalConsentAt: new Date(),
          termsConsentAt: new Date(),
          ...(data.imageConsent === true ? { imageConsentAt: new Date() } : {}),
          tier: label,
          priceCents,
          status: waitlisted ? "LISTE_ATTENTE" : "CONFIRMEE",
        },
      });
      const ticket = waitlisted
        ? null
        : await tx.ticket.create({
            data: {
              eventId: event.id,
              registrationId: registration.id,
              ...(actor ? { userId: actor.id } : {}),
              userEmail: participantEmail,
              code: createOpaqueToken("AE2V-2026-TK-"),
              tier: label,
              priceCents,
              status: priceCents > 0 ? "en_attente_paiement" : "valide",
            },
          });
      if (priceCents > 0 && !waitlisted) {
        await tx.payment.create({
          data: {
            ...(actor ? { userId: actor.id } : {}),
            eventId: event.id,
            registrationId: registration.id,
            amountCents: priceCents,
            status: "EN_ATTENTE",
            kind: "INSCRIPTION_EVENEMENT",
            provider: "HELLOASSO",
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "EVENT_REGISTRATION_CREATED",
          details: `${event.id} · ${participantEmail} · ${label}`,
          author: actor ? `${actor.firstName} ${actor.lastName}` : participantName,
        },
      });
      return { registration, ticket };
    });
    return { ok: true as const, ...result };
  });

export const cancelEventRegistrationServer = createServerFn({ method: "POST" })
  .validator(z.object({ registrationId: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const actor = await getServerActor();
    if (!actor) throw new Response("Connexion requise", { status: 401 });
    const prisma = getPrisma();
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: data.registrationId },
      include: { event: true },
    });
    if (!registration) throw new Response("Inscription introuvable", { status: 404 });
    const isBureau = ["BUREAU", "TRESORIER", "PRESIDENT"].includes(actor.role);
    if (!isBureau && registration.userId !== actor.id)
      throw new Response("Accès refusé", { status: 403 });
    if (registration.status === "ANNULEE") return { ok: true as const };
    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: { status: "ANNULEE" },
      });
      await tx.ticket.updateMany({
        where: {
          eventId: registration.eventId,
          ...(registration.userId
            ? { userId: registration.userId }
            : { userEmail: registration.userEmail }),
        },
        data: { status: "annule" },
      });
      if (registration.priceCents > 0) {
        await tx.payment.updateMany({
          where: {
            registrationId: registration.id,
            kind: "INSCRIPTION_EVENEMENT",
            status: "EN_ATTENTE",
          },
          data: {
            status: "ANNULE",
            notes: "Inscription événement annulée",
          },
        });
      }
      if (registration.status === "CONFIRMEE") {
        const nextWaitlisted = registration.event.waitlist
          ? await tx.eventRegistration.findFirst({
              where: { eventId: registration.eventId, status: "LISTE_ATTENTE" },
              orderBy: { createdAt: "asc" },
            })
          : null;
        if (nextWaitlisted) {
          await tx.eventRegistration.update({
            where: { id: nextWaitlisted.id },
            data: { status: "CONFIRMEE" },
          });
          await tx.ticket.create({
            data: {
              eventId: registration.eventId,
              userId: nextWaitlisted.userId,
              userEmail: nextWaitlisted.userEmail,
              code: createOpaqueToken("AE2V-2026-TK-"),
              tier: nextWaitlisted.tier,
              priceCents: nextWaitlisted.priceCents,
              status: nextWaitlisted.priceCents > 0 ? "en_attente_paiement" : "valide",
            },
          });
          if (nextWaitlisted.priceCents > 0) {
            await tx.payment.create({
              data: {
                ...(nextWaitlisted.userId ? { userId: nextWaitlisted.userId } : {}),
                eventId: registration.eventId,
                registrationId: nextWaitlisted.id,
                amountCents: nextWaitlisted.priceCents,
                status: "EN_ATTENTE",
                kind: "INSCRIPTION_EVENEMENT",
                provider: "HELLOASSO",
              },
            });
          }
          await tx.auditLog.create({
            data: {
              action: "EVENT_WAITLIST_PROMOTED",
              details: `${nextWaitlisted.id} · ${registration.event.title}`,
              author: `${actor.firstName} ${actor.lastName}`,
            },
          });
        } else {
          await tx.event.update({
            where: { id: registration.eventId },
            data: {
              registered: { decrement: 1 },
              ...(registration.event.status === "COMPLET" ? { status: "OUVERT" } : {}),
            },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          action: "EVENT_REGISTRATION_CANCELLED",
          details: `${registration.id} · ${registration.event.title}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
    });
    return { ok: true as const };
  });

export const checkInTicketServer = createServerFn({ method: "POST" })
  .validator(z.object({ ticketCode: z.string().trim().min(8).max(120) }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { code: data.ticketCode },
      include: { event: true },
    });
    if (!ticket) throw new Response("Billet introuvable", { status: 404 });
    if (ticket.status === "utilise") throw new Response("Billet déjà utilisé", { status: 409 });
    if (ticket.status !== "valide")
      throw new Response("Paiement du billet non confirmé", { status: 409 });
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "utilise" },
      });
      await tx.auditLog.create({
        data: {
          action: "EVENT_TICKET_CHECKED_IN",
          details: `${ticket.code} · ${ticket.event.title}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return next;
    });
    return { ok: true as const, ticket: updated };
  });

export const getTicketScanContextServer = createServerFn({ method: "GET" })
  .validator(z.object({ ticketCode: z.string().trim().min(8).max(120) }))
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const ticket = await getPrisma().ticket.findUnique({
      where: { code: data.ticketCode },
      include: {
        event: { select: { id: true, title: true, date: true, place: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        registration: {
          select: {
            participantName: true,
            userEmail: true,
            payments: { select: { id: true, status: true, invoiceId: true } },
          },
        },
      },
    });
    if (!ticket) throw new Response("Billet introuvable", { status: 404 });
    return {
      ticket: {
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        tier: ticket.tier,
        priceCents: ticket.priceCents,
        eventId: ticket.event.id,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.date,
        eventPlace: ticket.event.place,
        userEmail: ticket.userEmail,
        participantName: ticket.registration?.participantName ?? null,
        paymentId: ticket.registration?.payments[0]?.id ?? null,
        paymentStatus: ticket.registration?.payments[0]?.status ?? null,
        invoiceId: ticket.registration?.payments[0]?.invoiceId ?? null,
      },
      person: ticket.user,
    };
  });

export const getEventRegistrationsServer = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: data.eventId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const tickets = await prisma.ticket.findMany({
      where: { eventId: data.eventId },
      select: { registrationId: true, userEmail: true, code: true, status: true },
    });
    const payments = await prisma.payment.findMany({
      where: { eventId: data.eventId },
      select: { id: true, userId: true, registrationId: true, amountCents: true, status: true },
    });
    return registrations.map((registration) => {
      const ticket =
        tickets.find((candidate) => candidate.registrationId === registration.id) ??
        tickets.find((candidate) => candidate.userEmail === registration.userEmail);
      const payment = payments.find(
        (candidate) =>
          candidate.registrationId === registration.id ||
          (!candidate.registrationId &&
            Boolean(registration.userId) &&
            candidate.userId === registration.userId),
      );
      return {
        id: registration.id,
        personId: registration.userId,
        name: registration.user
          ? `${registration.user.firstName} ${registration.user.lastName}`
          : (registration.participantName ?? registration.userEmail),
        email: registration.userEmail,
        phone: registration.participantPhone,
        legalConsentAt: registration.legalConsentAt?.toISOString() ?? null,
        termsConsentAt: registration.termsConsentAt?.toISOString() ?? null,
        imageConsentAt: registration.imageConsentAt?.toISOString() ?? null,
        tier: registration.tier,
        priceCents: registration.priceCents,
        status: registration.status,
        ticketCode: ticket?.code ?? null,
        ticketStatus: ticket?.status ?? null,
        paymentId: payment?.id ?? null,
        paymentStatus: payment?.status ?? null,
      };
    });
  });

export const getEventStatsServer = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { capacity: true, registered: true },
    });
    if (!event) throw new Response("Événement introuvable", { status: 404 });
    const [payments, tickets, registrations] = await Promise.all([
      prisma.payment.findMany({
        where: { eventId: data.eventId },
        select: { amountCents: true, refundedAmountCents: true, status: true },
      }),
      prisma.ticket.findMany({ where: { eventId: data.eventId }, select: { status: true } }),
      prisma.eventRegistration.findMany({
        where: { eventId: data.eventId },
        select: { status: true },
      }),
    ]);
    const revenueEligible = payments.filter((payment) =>
      ["EN_ATTENTE", "CONFIRME", "PARTIELLEMENT_REMBOURSE"].includes(payment.status),
    );
    const confirmedEligible = payments.filter((payment) =>
      ["CONFIRME", "PARTIELLEMENT_REMBOURSE"].includes(payment.status),
    );
    return {
      registered: event.registered,
      capacity: event.capacity,
      pendingPayments: payments.filter((payment) => payment.status === "EN_ATTENTE").length,
      confirmedPayments: confirmedEligible.length,
      revenueExpectedCents: revenueEligible.reduce(
        (total, payment) => total + payment.amountCents - (payment.refundedAmountCents ?? 0),
        0,
      ),
      revenueConfirmedCents: confirmedEligible.reduce(
        (total, payment) => total + payment.amountCents - (payment.refundedAmountCents ?? 0),
        0,
      ),
      cancelled: registrations.filter((registration) => registration.status === "ANNULEE").length,
      waitlisted: registrations.filter((registration) => registration.status === "LISTE_ATTENTE")
        .length,
      present: tickets.filter((ticket) => ticket.status === "utilise").length,
      absent: tickets.filter((ticket) => ticket.status === "valide").length,
    };
  });
