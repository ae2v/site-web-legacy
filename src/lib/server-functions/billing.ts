import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { requireBureauActor } from "@/lib/server/auth";

const developmentSecret = "ae2v-development-only-session-secret-change-me-2026";
const sessionConfig = () => {
  const password = process.env["SESSION_SECRET"] ?? developmentSecret;
  if (process.env["NODE_ENV"] === "production" && password === developmentSecret) {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  return {
    password,
    name: "ae2v_session",
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  };
};

export type BureauBillingSnapshot = {
  orders: Array<{
    id: string;
    date: string;
    customerName: string;
    customerEmail: string;
    totalCents: number;
    status: string;
    helloAssoId: string | null;
    notes: string | null;
    items: Array<{
      productId: string;
      productName: string;
      qty: number;
      unitPriceCents: number;
    }>;
  }>;
  invoices: Array<{
    id: string;
    date: string;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
    totalCents: number;
    status: string;
    lines: Array<{
      description: string;
      qty: number;
      unitPriceCents: number;
      totalCents: number;
    }>;
    notes: string | null;
    paymentId: string | null;
    paymentStatus: string | null;
    refundedAmountCents: number;
  }>;
};

function parseInvoiceLines(value: string, fallbackDescription: string, fallbackTotal: number) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (line): line is Record<string, unknown> =>
            typeof line === "object" && line !== null && typeof line["description"] === "string",
        )
        .map((line) => {
          const qty =
            typeof line["qty"] === "number" && Number.isInteger(line["qty"]) ? line["qty"] : 1;
          const unitPriceCents =
            typeof line["unitPriceCents"] === "number" && Number.isInteger(line["unitPriceCents"])
              ? line["unitPriceCents"]
              : fallbackTotal;
          return {
            description: String(line["description"]),
            qty,
            unitPriceCents,
            totalCents:
              typeof line["totalCents"] === "number" && Number.isInteger(line["totalCents"])
                ? line["totalCents"]
                : unitPriceCents * qty,
          };
        });
    }
  } catch {
    // Fallback below keeps old invoices readable.
  }
  return [
    {
      description: fallbackDescription,
      qty: 1,
      unitPriceCents: fallbackTotal,
      totalCents: fallbackTotal,
    },
  ];
}

export const getBureauBillingServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<BureauBillingSnapshot> => {
    await requireBureauActor("read");
    const prisma = getPrisma();
    const [orders, invoices] = await Promise.all([
      prisma.order.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({
        include: {
          payments: {
            select: { id: true, status: true, refundedAmountCents: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      orders: orders.map((order) => ({
        id: order.id,
        date: order.date,
        customerName: order.customerName,
        customerEmail: order.userEmail,
        totalCents: order.totalCents,
        status: order.status,
        helloAssoId: order.helloAssoId,
        notes: order.notes,
        items: order.lines.map((line) => ({
          productId: line.productId ?? line.productName,
          productName: line.productName,
          qty: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        date: invoice.date,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        paymentMethod: invoice.paymentMethod,
        totalCents: invoice.priceCents,
        status: invoice.status,
        lines: parseInvoiceLines(invoice.linesJson, invoice.description, invoice.priceCents),
        notes: invoice.notes,
        paymentId: invoice.payments[0]?.id ?? null,
        paymentStatus: invoice.payments[0]?.status ?? null,
        refundedAmountCents: invoice.payments[0]?.refundedAmountCents ?? 0,
      })),
    };
  },
);

async function requireTreasury() {
  // Session API is server-runtime scoped, despite its `use` prefix.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = await useSession<{ userId?: string }>(sessionConfig());
  const userId = session.data.userId;
  if (!userId) throw new Response("Connexion bureau requise", { status: 401 });
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, firstName: true, lastName: true },
  });
  if (!user || !["TRESORIER", "PRESIDENT"].includes(user.role)) {
    throw new Response("Droit trésorerie requis", { status: 403 });
  }
  return user;
}

export const createInvoiceServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().min(1).max(100).optional(),
      customerName: z.string().trim().min(1).max(160),
      customerEmail: z.string().trim().email().max(254),
      paymentMethod: z.string().trim().min(1).max(60),
      description: z.string().trim().min(1).max(240),
      amountCents: z.number().int().positive().max(10_000_000),
      notes: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireTreasury();
    const prisma = getPrisma();
    const targetUser = data.userId
      ? await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true, schoolYear: true },
        })
      : await prisma.user.findUnique({
          where: { email: data.customerEmail.toLowerCase() },
          select: { id: true, schoolYear: true },
        });
    if (data.userId && !targetUser) {
      throw new Response("Utilisateur introuvable", { status: 404 });
    }
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          ...(targetUser ? { userId: targetUser.id } : {}),
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          paymentMethod: data.paymentMethod,
          priceCents: data.amountCents,
          description: data.description,
          linesJson: JSON.stringify([
            {
              description: data.description,
              qty: 1,
              unitPriceCents: data.amountCents,
              totalCents: data.amountCents,
            },
          ]),
          date: new Date().toLocaleDateString("fr-FR"),
          ...(data.notes ? { notes: data.notes } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "INVOICE_CREATED",
          details: `${created.id} · ${data.amountCents} centimes`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      const payment = await tx.payment.create({
        data: {
          ...(targetUser ? { userId: targetUser.id } : {}),
          invoiceId: created.id,
          amountCents: data.amountCents,
          status: "CONFIRME",
          kind: "ENCAISSEMENT_MANUEL",
          paymentMethod: data.paymentMethod,
          confirmedAt: new Date(),
          ...(data.notes ? { notes: data.notes } : {}),
        },
      });
      if (targetUser && data.description.toLowerCase().includes("cotisation")) {
        await tx.user.update({
          where: { id: targetUser.id },
          data: { contributionStatus: "PAYEE", contributionCents: data.amountCents },
        });
        await tx.membership.updateMany({
          where: { userId: targetUser.id, schoolYear: targetUser.schoolYear },
          data: {
            contributionStatus: "PAYEE",
            amountCents: data.amountCents,
            validatedAt: new Date(),
          },
        });
      }
      return created;
    });
    return { ok: true as const, invoice };
  });

const invoiceLineSchema = z.object({
  description: z.string().trim().min(1).max(240),
  qty: z.number().int().positive().max(1000),
  unitPriceCents: z.number().int().nonnegative().max(10_000_000),
});

export const updateInvoiceServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      invoiceId: z.string().min(1).max(100),
      description: z.string().trim().min(1).max(240),
      paymentMethod: z.string().trim().min(1).max(60),
      lines: z.array(invoiceLineSchema).min(1).max(30),
      status: z.enum(["EMISE", "ANNULEE", "REMBOURSEE", "PARTIELLEMENT_REMBOURSEE"]),
      notes: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireTreasury();
    const prisma = getPrisma();
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { payments: { select: { status: true } } },
    });
    if (!invoice) throw new Response("Facture introuvable", { status: 404 });
    const lines = data.lines.map((line) => ({
      ...line,
      totalCents: line.qty * line.unitPriceCents,
    }));
    const totalCents = lines.reduce((total, line) => total + line.totalCents, 0);
    if (
      invoice.payments.some((payment) =>
        ["CONFIRME", "PARTIELLEMENT_REMBOURSE", "REMBOURSE"].includes(payment.status),
      ) &&
      totalCents !== invoice.priceCents
    ) {
      throw new Response("Une facture payée ne peut pas changer de total ; créez un avoir.", {
        status: 409,
      });
    }
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        description: data.description,
        paymentMethod: data.paymentMethod,
        priceCents: totalCents,
        linesJson: JSON.stringify(lines),
        status: data.status,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "INVOICE_UPDATED",
        details: `${updated.id} · ${invoice.priceCents} → ${totalCents}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return { ok: true as const, invoice: updated };
  });

export const importHelloAssoOrderServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerName: z.string().trim().min(1).max(160),
      customerEmail: z.string().trim().email().max(254),
      userId: z.string().trim().min(1).max(100).optional(),
      productName: z.string().trim().min(1).max(160),
      amountCents: z.number().int().positive().max(10_000_000),
      items: z
        .array(
          z.object({
            productName: z.string().trim().min(1).max(160),
            quantity: z.number().int().positive().max(1000),
            unitPriceCents: z.number().int().positive().max(10_000_000),
            variant: z.string().trim().max(120).optional(),
          }),
        )
        .min(1)
        .max(100)
        .optional(),
      helloAssoId: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(1000).optional(),
      paymentStatus: z.enum(["EN_ATTENTE", "CONFIRME"]).default("CONFIRME"),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireTreasury();
    const prisma = getPrisma();
    if (data.helloAssoId) {
      const existing = await prisma.order.findUnique({
        where: { helloAssoId: data.helloAssoId },
      });
      if (existing) return { ok: true as const, order: existing, alreadyImported: true as const };
    }
    const user = data.userId
      ? await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true, email: true },
        })
      : await prisma.user.findUnique({
          where: { email: data.customerEmail.toLowerCase() },
          select: { id: true, email: true },
        });
    if (data.userId && !user) throw new Response("Adhérent introuvable", { status: 404 });
    const linkedEmail = user?.email ?? data.customerEmail.toLowerCase();
    const orderItems = data.items?.length
      ? data.items
      : [{ productName: data.productName, quantity: 1, unitPriceCents: data.amountCents }];
    const totalCents = orderItems.reduce(
      (total, item) => total + item.quantity * item.unitPriceCents,
      0,
    );
    if (totalCents <= 0 || totalCents > 10_000_000) {
      throw new Response("Total de commande invalide", { status: 422 });
    }
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          ...(user ? { userId: user.id } : {}),
          userEmail: linkedEmail,
          customerName: data.customerName,
          date: new Date().toLocaleDateString("fr-FR"),
          totalCents,
          status: data.paymentStatus === "CONFIRME" ? "PAYEE" : "EN_ATTENTE",
          ...(data.helloAssoId ? { helloAssoId: data.helloAssoId } : {}),
          ...(data.notes ? { notes: data.notes } : {}),
          lines: {
            create: orderItems.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              ...(item.variant ? { variant: item.variant } : {}),
            })),
          },
        },
      });
      const payment = await tx.payment.create({
        data: {
          ...(user ? { userId: user.id } : {}),
          orderId: created.id,
          amountCents: totalCents,
          status: data.paymentStatus,
          kind: "COMMANDE_HELLOASSO",
          provider: "HELLOASSO",
          ...(data.helloAssoId ? { providerReference: data.helloAssoId } : {}),
          ...(data.paymentStatus === "CONFIRME" ? { confirmedAt: new Date() } : {}),
        },
      });
      if (data.paymentStatus === "CONFIRME") {
        const invoice = await tx.invoice.create({
          data: {
            ...(user ? { userId: user.id } : {}),
            orderId: created.id,
            customerName: data.customerName,
            customerEmail: linkedEmail,
            paymentMethod: "HelloAsso",
            priceCents: totalCents,
            description: `Commande HelloAsso ${created.id}`,
            linesJson: JSON.stringify(
              orderItems.map((item) => ({
                description: item.productName + (item.variant ? ` — ${item.variant}` : ""),
                qty: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalCents: item.quantity * item.unitPriceCents,
              })),
            ),
            date: new Date().toLocaleDateString("fr-FR"),
          },
        });
        await tx.payment.update({ where: { id: payment.id }, data: { invoiceId: invoice.id } });
        await tx.auditLog.create({
          data: {
            action: "INVOICE_AUTO_CREATED",
            details: `${invoice.id} · commande ${created.id} · ${totalCents} centimes`,
            author: `${actor.firstName} ${actor.lastName}`,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "ORDER_IMPORTED_FROM_HELLOASSO",
          details: `${created.id} · ${totalCents} centimes · ${data.customerEmail}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return created;
    });
    return { ok: true as const, order };
  });

export const updateOrderServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().trim().min(1).max(100),
      status: z.enum(["EN_ATTENTE", "PAYEE", "LIVREE", "ANNULEE"]),
      notes: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const existing = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        lines: true,
        payments: {
          select: {
            id: true,
            status: true,
            amountCents: true,
            invoiceId: true,
            paymentMethod: true,
          },
        },
      },
    });
    if (!existing) throw new Response("Commande introuvable", { status: 404 });
    if (
      data.status === "EN_ATTENTE" &&
      existing.payments.some((payment) =>
        ["CONFIRME", "PARTIELLEMENT_REMBOURSE", "REMBOURSE"].includes(payment.status),
      )
    ) {
      throw new Response("Un paiement confirmé ne peut pas repasser en attente.", { status: 409 });
    }
    if (
      data.status === "ANNULEE" &&
      existing.payments.some((payment) =>
        ["CONFIRME", "PARTIELLEMENT_REMBOURSE"].includes(payment.status),
      )
    ) {
      throw new Response("Remboursez d’abord le paiement confirmé de cette commande", {
        status: 409,
      });
    }
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });
      if (data.status === "ANNULEE") {
        await tx.payment.updateMany({
          where: { orderId: existing.id, status: "EN_ATTENTE" },
          data: { status: "ANNULE", notes: "Commande annulée" },
        });
      }
      if (data.status === "PAYEE") {
        const pendingPayment = existing.payments.find((payment) => payment.status === "EN_ATTENTE");
        const confirmedPayment = existing.payments.find((payment) => payment.status === "CONFIRME");
        const payment = pendingPayment ?? confirmedPayment;
        let paymentId = payment?.id ?? null;
        let invoiceId = payment?.invoiceId ?? null;
        if (pendingPayment) {
          await tx.payment.update({
            where: { id: pendingPayment.id },
            data: { status: "CONFIRME", confirmedAt: new Date() },
          });
        }
        if (!paymentId) {
          const createdPayment = await tx.payment.create({
            data: {
              orderId: existing.id,
              amountCents: existing.totalCents,
              status: "CONFIRME",
              kind: "COMMANDE_HELLOASSO",
              provider: "HELLOASSO",
              confirmedAt: new Date(),
            },
          });
          paymentId = createdPayment.id;
        }
        if (!invoiceId) {
          const invoice = await tx.invoice.create({
            data: {
              ...(existing.userId ? { userId: existing.userId } : {}),
              orderId: existing.id,
              customerName: existing.customerName,
              customerEmail: existing.userEmail,
              paymentMethod: payment?.paymentMethod ?? "HelloAsso",
              priceCents: existing.totalCents,
              description: `Commande HelloAsso ${existing.id}`,
              linesJson: JSON.stringify(
                existing.lines.map((line) => ({
                  description: `${line.productName}${line.variant ? ` — ${line.variant}` : ""}`,
                  qty: line.quantity,
                  unitPriceCents: line.unitPriceCents,
                  totalCents: line.quantity * line.unitPriceCents,
                })),
              ),
              date: new Date().toLocaleDateString("fr-FR"),
            },
          });
          invoiceId = invoice.id;
          await tx.payment.update({ where: { id: paymentId }, data: { invoiceId: invoice.id } });
          await tx.auditLog.create({
            data: {
              action: "INVOICE_AUTO_CREATED",
              details: `${invoice.id} · commande ${existing.id} · confirmation manuelle`,
              author: `${actor.firstName} ${actor.lastName}`,
            },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          action: "ORDER_STATUS_CHANGED",
          details: `${updated.id}: ${existing.status} → ${data.status}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return updated;
    });
    return { ok: true as const, order };
  });

export const refundOrderServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().min(1).max(100),
      amountCents: z.number().int().positive().max(10_000_000),
      note: z.string().trim().min(1).max(1000),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireTreasury();
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) throw new Response("Commande introuvable", { status: 404 });
    const confirmedPayment = order.payments.find((item) => item.status === "CONFIRME");
    const partialPayment = order.payments.find((item) => item.status === "PARTIELLEMENT_REMBOURSE");
    const payment = confirmedPayment ?? partialPayment;
    const alreadyRefundedCents = payment?.refundedAmountCents ?? 0;
    const remainingRefundableCents = order.totalCents - alreadyRefundedCents;
    if (data.amountCents > remainingRefundableCents) {
      throw new Response("Le remboursement dépasse le montant de la commande", { status: 422 });
    }
    if (!payment) throw new Response("Aucun paiement confirmé à rembourser", { status: 409 });
    const refundedTotalCents = alreadyRefundedCents + data.amountCents;
    const fullRefund = refundedTotalCents === order.totalCents;
    const updated = await prisma.$transaction(async (tx) => {
      const nextPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: fullRefund ? "REMBOURSE" : "PARTIELLEMENT_REMBOURSE",
          refundedAmountCents: refundedTotalCents,
          refundedAt: new Date(),
          notes: data.note,
        },
      });
      const nextOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: fullRefund ? "ANNULEE" : "PAYEE",
          notes: `${order.notes ? `${order.notes} · ` : ""}Remboursement ${data.amountCents} centimes : ${data.note}`,
        },
      });
      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: fullRefund ? "REMBOURSEE" : "PARTIELLEMENT_REMBOURSEE",
            notes: `Remboursement ${data.amountCents} centimes : ${data.note}`,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "ORDER_REFUNDED",
          details: `${order.id} · ${data.amountCents} centimes · ${data.note}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return { payment: nextPayment, order: nextOrder };
    });
    return { ok: true as const, ...updated };
  });
