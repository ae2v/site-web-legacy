import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { getServerActor, requireBureauActor } from "@/lib/server/auth";

const messageStatus = z.enum(["NOUVEAU", "LU", "TRAITE"]);

export type ServerContactMessage = {
  id: string;
  name: string;
  email: string;
  sujet: string;
  message: string;
  status: "NOUVEAU" | "LU" | "TRAITE";
  sentAt: string;
  readByMe: boolean;
  readByCount: number;
  readByNames: string[];
  readByOtherCount: number;
  readByOtherNames: string[];
};

function toClientStatus(status: string): ServerContactMessage["status"] {
  return status === "TRAITE" ? "TRAITE" : status === "LU" ? "LU" : "NOUVEAU";
}

function serializeMessage(
  message: {
    id: string;
    name: string;
    email: string;
    sujet: string;
    message: string;
    status: string;
    sentAt: string;
    reads?: { userId: string; user: { firstName: string; lastName: string } }[];
  },
  actorId?: string,
): ServerContactMessage {
  const reads = message.reads ?? [];
  return {
    ...message,
    status: toClientStatus(message.status),
    readByMe: actorId ? reads.some((read) => read.userId === actorId) : false,
    readByCount: reads.length,
    readByNames: reads.map((read) => `${read.user.firstName} ${read.user.lastName}`),
    readByOtherCount: actorId
      ? reads.filter((read) => read.userId !== actorId).length
      : reads.length,
    readByOtherNames: reads
      .filter((read) => !actorId || read.userId !== actorId)
      .map((read) => `${read.user.firstName} ${read.user.lastName}`),
  };
}

export const submitContactMessageServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(255),
      sujet: z.string().trim().min(2).max(80),
      message: z.string().trim().min(20).max(1500),
    }),
  )
  .handler(async ({ data }) => {
    const created = await getPrisma().contactMessage.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        sujet: data.sujet,
        message: data.message,
        status: "NON_LU",
        sentAt: new Date().toISOString(),
      },
    });
    return { ok: true as const, message: serializeMessage(created) };
  });

export const getContactMessagesServer = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await requireBureauActor("read");
  const messages = await getPrisma().contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reads: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
    },
  });
  return messages.map((message) => serializeMessage(message, actor.id));
});

export const markContactMessageReadServer = createServerFn({ method: "POST" })
  .validator(z.object({ messageId: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("read");
    const prisma = getPrisma();
    const message = await prisma.contactMessage.findUnique({ where: { id: data.messageId } });
    if (!message) throw new Response("Message introuvable", { status: 404 });
    await prisma.contactMessageRead.upsert({
      where: { contactMessageId_userId: { contactMessageId: data.messageId, userId: actor.id } },
      update: { readAt: new Date() },
      create: { contactMessageId: data.messageId, userId: actor.id },
    });
    if (message.status === "NON_LU") {
      await prisma.contactMessage.update({ where: { id: message.id }, data: { status: "LU" } });
    }
    const updated = await prisma.contactMessage.findUniqueOrThrow({
      where: { id: message.id },
      include: {
        reads: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });
    return { ok: true as const, message: serializeMessage(updated, actor.id) };
  });

export const updateContactMessageServer = createServerFn({ method: "POST" })
  .validator(z.object({ messageId: z.string().min(1).max(100), status: messageStatus }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const updated = await getPrisma().contactMessage.update({
      where: { id: data.messageId },
      data: { status: data.status },
    });
    await getPrisma().auditLog.create({
      data: {
        action: "CONTACT_MESSAGE_STATUS_UPDATED",
        details: `${updated.id} · ${data.status}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    const withReads = await getPrisma().contactMessage.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        reads: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });
    return { ok: true as const, message: serializeMessage(withReads, actor.id) };
  });
