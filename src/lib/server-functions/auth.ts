import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { createOpaqueToken } from "@/lib/opaque-token";

const developmentSecret = "ae2v-development-only-session-secret-change-me-2026";

const passwordIterations = 310_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: passwordIterations,
      hash: "SHA-256",
    },
    key,
    512,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt);
  return `pbkdf2$${bytesToBase64Url(salt)}$${bytesToBase64Url(derived)}`;
}

async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored?.startsWith("pbkdf2$")) return false;
  const [, saltValue, hashValue] = stored.split("$");
  if (!saltValue || !hashValue) return false;
  const salt = base64UrlToBytes(saltValue);
  const expected = base64UrlToBytes(hashValue);
  const actual = await derivePassword(password, salt);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index]! ^ expected[index]!;
  }
  return difference === 0;
}

function sessionConfig() {
  const password = process.env["SESSION_SECRET"] ?? developmentSecret;
  if (process.env["NODE_ENV"] === "production" && password === developmentSecret) {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  return {
    password,
    name: "ae2v_session",
    maxAge: 60 * 60 * 24 * 14,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  };
}

export const signInServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const user = await getPrisma().user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: {
        id: true,
        demo: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        studentId: true,
        groupe: true,
        interestsJson: true,
        volunteer: true,
        message: true,
        rgpdAcceptedAt: true,
        statutsAcceptedAt: true,
        role: true,
        pole: true,
        roleTitle: true,
        departement: true,
        niveau: true,
        contributionCents: true,
        contributionStatus: true,
        membershipStatus: true,
        schoolYear: true,
        emailPrefs: true,
        cardCode: true,
        memberSince: true,
        requestedAt: true,
        validatedAt: true,
        password: true,
        tickets: {
          include: {
            event: { select: { id: true, slug: true, title: true, date: true, place: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        orders: { include: { lines: true }, orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!user || !(await verifyPassword(data.password, user.password))) {
      return { ok: false as const, error: "Identifiants inconnus ou mot de passe incorrect." };
    }
    const session = await useSession<{ userId?: string }>(sessionConfig());
    await session.update({ userId: user.id });
    return {
      ok: true as const,
      user: {
        id: user.id,
        demo: user.demo,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        studentId: user.studentId,
        groupe: user.groupe,
        interestsJson: user.interestsJson,
        volunteer: user.volunteer,
        message: user.message,
        rgpdAcceptedAt: user.rgpdAcceptedAt,
        statutsAcceptedAt: user.statutsAcceptedAt,
        role: user.role,
        pole: user.pole,
        roleTitle: user.roleTitle,
        departement: user.departement,
        niveau: user.niveau,
        contributionCents: user.contributionCents,
        contributionStatus: user.contributionStatus,
        membershipStatus: user.membershipStatus,
        schoolYear: user.schoolYear,
        emailPrefs: user.emailPrefs,
        cardCode: user.cardCode,
        memberSince: user.memberSince,
        requestedAt: user.requestedAt,
        validatedAt: user.validatedAt,
        tickets: user.tickets.map((ticket) => ({
          id: ticket.id,
          eventId: ticket.event.slug,
          eventTitle: ticket.event.title,
          date: ticket.event.date,
          place: ticket.event.place,
          tier: ticket.tier,
          priceCents: ticket.priceCents,
          code: ticket.code,
          status: ticket.status,
        })),
        orders: user.orders.map((order) => ({
          id: order.id,
          date: order.date,
          status: order.status,
          lines: order.lines.map((line) => ({
            name: line.productName,
            variant: line.variant ?? "Standard",
            qty: line.quantity,
            priceCents: line.unitPriceCents,
          })),
        })),
        invoices: user.invoices.map((invoice) => ({
          id: invoice.id,
          date: invoice.date,
          description: invoice.description,
          totalCents: invoice.priceCents,
          status: invoice.status,
          paymentMethod: invoice.paymentMethod,
        })),
        payments: user.payments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          status: payment.status,
          kind: payment.kind,
          createdAt: payment.createdAt.toLocaleDateString("fr-FR"),
          refundedAmountCents: payment.refundedAmountCents ?? 0,
        })),
      },
    };
  });

export const signOutServer = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<{ userId?: string }>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

const quickAccessKeys = ["president", "bureau", "cotisant", "non-cotisant"] as const;

/**
 * Quick access is intentionally limited to the four seeded accounts used for
 * demonstrations and internal acceptance testing. It never returns a
 * password to the browser: it only creates the same server session as a
 * regular sign-in.
 */
export const quickSignInServer = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.enum(quickAccessKeys) }))
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where:
        data.key === "president"
          ? { role: "PRESIDENT", demo: false }
          : data.key === "bureau"
            ? { role: { in: ["BUREAU", "TRESORIER"] }, demo: false }
            : data.key === "cotisant"
              ? { role: "MEMBRE", demo: true, contributionStatus: "PAYEE" }
              : { role: "MEMBRE", demo: true, contributionStatus: "NON_COTISANT" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!user) return { ok: false as const, error: "Compte rapide indisponible." };

    const session = await useSession<{ userId?: string }>(sessionConfig());
    await session.update({ userId: user.id });
    return { ok: true as const };
  });

export const signUpServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email().max(254),
      password: z.string().min(8).max(200),
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      departement: z.string().trim().min(1).max(120),
      niveau: z.string().trim().min(1).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: false as const, error: "Cette adresse e-mail est déjà utilisée." };

    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        departement: data.departement,
        niveau: data.niveau,
        cardCode: createOpaqueToken("AE2V-2026-USR-"),
        membershipStatus: "DEMANDE_SOUMISE",
        contributionStatus: "NON_COTISANT",
      },
      select: {
        id: true,
        demo: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        studentId: true,
        groupe: true,
        interestsJson: true,
        volunteer: true,
        message: true,
        rgpdAcceptedAt: true,
        statutsAcceptedAt: true,
        role: true,
        pole: true,
        roleTitle: true,
        departement: true,
        niveau: true,
        contributionCents: true,
        contributionStatus: true,
        membershipStatus: true,
        schoolYear: true,
        emailPrefs: true,
        cardCode: true,
        memberSince: true,
        requestedAt: true,
        validatedAt: true,
      },
    });
    const session = await useSession<{ userId?: string }>(sessionConfig());
    await session.update({ userId: user.id });
    return {
      ok: true as const,
      user: { ...user, tickets: [], orders: [], invoices: [], payments: [] },
    };
  });

export const getCurrentUserServer = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<{ userId?: string }>(sessionConfig());
  if (!session.data.userId) return { ok: false as const };
  const user = await getPrisma().user.findUnique({
    where: { id: session.data.userId },
    select: {
      id: true,
      demo: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      studentId: true,
      groupe: true,
      interestsJson: true,
      volunteer: true,
      message: true,
      rgpdAcceptedAt: true,
      statutsAcceptedAt: true,
      role: true,
      pole: true,
      roleTitle: true,
      departement: true,
      niveau: true,
      contributionCents: true,
      contributionStatus: true,
      membershipStatus: true,
      schoolYear: true,
      emailPrefs: true,
      cardCode: true,
      memberSince: true,
      requestedAt: true,
      validatedAt: true,
      tickets: {
        include: {
          event: { select: { id: true, slug: true, title: true, date: true, place: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      orders: { include: { lines: true }, orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) {
    await session.clear();
    return { ok: false as const };
  }
  return {
    ok: true as const,
    user: {
      ...user,
      tickets: user.tickets.map((ticket) => ({
        id: ticket.id,
        eventId: ticket.event.slug,
        eventTitle: ticket.event.title,
        date: ticket.event.date,
        place: ticket.event.place,
        tier: ticket.tier,
        priceCents: ticket.priceCents,
        code: ticket.code,
        status: ticket.status,
      })),
      orders: user.orders.map((order) => ({
        id: order.id,
        date: order.date,
        status: order.status,
        lines: order.lines.map((line) => ({
          name: line.productName,
          variant: line.variant ?? "Standard",
          qty: line.quantity,
          priceCents: line.unitPriceCents,
        })),
      })),
      invoices: user.invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        description: invoice.description,
        totalCents: invoice.priceCents,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
      })),
      payments: user.payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        status: payment.status,
        kind: payment.kind,
        createdAt: payment.createdAt.toLocaleDateString("fr-FR"),
        refundedAmountCents: payment.refundedAmountCents ?? 0,
      })),
    },
  };
});
