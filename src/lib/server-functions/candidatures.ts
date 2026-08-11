import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { getServerActor, requireBureauActor } from "@/lib/server/auth";

const candidatureStatus = z.enum(["EN_ATTENTE", "ENTRETIEN", "ACCEPTEE", "REFUSEE"]);

const toView = (candidature: {
  id: string;
  name: string;
  email: string;
  pole: string;
  motivation: string;
  availability: string;
  status: string;
  internalNotes: string | null;
  submittedAt: Date;
}) => ({
  id: candidature.id,
  name: candidature.name,
  email: candidature.email,
  pole: candidature.pole,
  motivation: candidature.motivation,
  availability: candidature.availability,
  status: candidature.status,
  ...(candidature.internalNotes ? { internalNotes: candidature.internalNotes } : {}),
  submittedAt: candidature.submittedAt.toLocaleDateString("fr-FR"),
});

export const getOwnCandidaturesServer = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await getServerActor();
  if (!actor) throw new Response("Connexion requise", { status: 401 });
  const rows = await getPrisma().candidature.findMany({
    where: { userId: actor.id },
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(toView);
});

export const submitCandidatureServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pole: z.string().trim().min(1).max(80),
      motivation: z.string().trim().min(20).max(500),
      availability: z.string().trim().min(1).max(160),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await getServerActor();
    if (!actor) throw new Response("Connexion requise", { status: 401 });
    const active = await getPrisma().candidature.findFirst({
      where: { userId: actor.id, status: { in: ["EN_ATTENTE", "ENTRETIEN"] } },
    });
    if (active) throw new Response("Une candidature est déjà en cours", { status: 409 });
    const row = await getPrisma().candidature.create({
      data: {
        userId: actor.id,
        name: `${actor.firstName} ${actor.lastName}`,
        email: actor.email,
        pole: data.pole,
        motivation: data.motivation,
        availability: data.availability,
      },
    });
    return toView(row);
  });

export const getBureauCandidaturesServer = createServerFn({ method: "GET" }).handler(async () => {
  await requireBureauActor("read");
  const rows = await getPrisma().candidature.findMany({ orderBy: { submittedAt: "asc" } });
  return rows.map(toView);
});

export const updateCandidatureServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      candidatureId: z.string().trim().min(1).max(100),
      status: candidatureStatus.optional(),
      internalNotes: z.string().trim().max(2000).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const row = await getPrisma().candidature.update({
      where: { id: data.candidatureId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      },
    });
    await getPrisma().auditLog.create({
      data: {
        action: "CANDIDATURE_MODIFIEE",
        details: `${row.id} · ${data.status ?? "note"}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return toView(row);
  });
