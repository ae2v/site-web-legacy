import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { getServerActor, requireBureauActor } from "@/lib/server/auth";
import { teamMembers } from "@/data/team";

const emailSchema = z
  .string()
  .trim()
  .email()
  .refine((value) => value.toLowerCase().endsWith("@ae2v.fr"), {
    message: "L’adresse publique doit se terminer par @ae2v.fr.",
  });

const teamSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  displayName: z.string().trim().min(2).max(120),
  roleTitle: z.string().trim().min(2).max(160).default("Membre du bureau"),
  roleTitles: z.array(z.string().trim().min(2).max(160)).max(12).default([]),
  officerRole: z
    .enum(["Président", "Vice-président", "Secrétaire", "Trésorier", "Trésorière"])
    .nullable()
    .optional(),
  poles: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  showDefaultPoleTitles: z.boolean().default(true),
  pole: z.string().trim().max(80).nullable().optional(),
  // Champs historiques conservés uniquement pour lire les anciennes lignes.
  // La source métier actuelle est exclusivement `poles`.
  secondaryPoles: z.array(z.string().trim().min(1).max(80)).max(8).optional().default([]),
  personalAe2vEmail: emailSchema.nullable().optional(),
  roleEmail: emailSchema.nullable().optional(),
  isOfficer: z.boolean(),
  bio: z.string().trim().max(1000).nullable().optional(),
  photoUrl: z.string().trim().max(2_000_000).nullable().optional(),
  mandateYear: z.string().regex(/^\d{4}-\d{4}$/),
  publicVisible: z.boolean().default(true),
  userId: z.string().min(1).max(100).nullable().optional(),
});

function parsePoles(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseTitles(value: string, fallback: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const titles = parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );
      if (titles.length) return titles;
    }
  } catch {
    // Legacy rows fall back to the original single title.
  }
  return [fallback];
}

function effectivePoles(
  value: string,
  legacyPole: string | null,
  legacySecondary: string,
): string[] {
  const parsed = parsePoles(value);
  if (parsed.length) return parsed;
  return [legacyPole, ...parsePoles(legacySecondary)].filter(
    (pole, index, values): pole is string => Boolean(pole) && values.indexOf(pole) === index,
  );
}

export type ServerTeamMember = {
  id: string;
  displayName: string;
  roleTitle: string;
  roleTitles: string[];
  officerRole: string | null;
  poles: string[];
  showDefaultPoleTitles: boolean;
  personalAe2vEmail: string | null;
  roleEmail: string | null;
  isOfficer: boolean;
  bio: string | null;
  photoUrl: string | null;
  mandateYear: string;
  displayOrder: number;
  publicVisible: boolean;
  userId: string | null;
};

/**
 * Repli de bootstrap lorsque la table n'a pas encore été seedée. Dès qu'une
 * fiche existe en base, PostgreSQL reste la source prioritaire.
 */
function bootstrapTeamMembers(): ServerTeamMember[] {
  return teamMembers.map((member, displayOrder) => ({
    id: member.id,
    displayName: member.displayName,
    roleTitle: member.roleTitle,
    roleTitles: member.roleTitles,
    officerRole: member.officerRole,
    poles: member.poles,
    showDefaultPoleTitles: member.showDefaultPoleTitles,
    personalAe2vEmail: member.personalAe2vEmail,
    roleEmail: member.roleEmail,
    isOfficer: member.isOfficer,
    bio: member.bio,
    photoUrl: member.photoUrl,
    mandateYear: member.mandate.replace("–", "-"),
    displayOrder,
    publicVisible: member.publicVisible,
    userId: member.userId ?? null,
  }));
}

export const getTeamMembersServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerTeamMember[]> => {
    await requireBureauActor("read");
    const members = await getPrisma().teamMember.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    const mapped = members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      roleTitle: member.roleTitle,
      roleTitles: parseTitles(member.roleTitlesJson, member.roleTitle),
      officerRole: member.officerRole,
      poles: effectivePoles(member.polesJson, member.pole, member.secondaryPolesJson),
      showDefaultPoleTitles: member.showDefaultPoleTitles,
      personalAe2vEmail: member.personalAe2vEmail,
      roleEmail: member.roleEmail,
      isOfficer: member.isOfficer,
      bio: member.bio,
      photoUrl: member.photoUrl,
      mandateYear: member.mandateYear,
      displayOrder: member.displayOrder,
      publicVisible: member.publicVisible,
      userId: member.userId,
    }));
    return mapped.length ? mapped : bootstrapTeamMembers();
  },
);

export const getPublicTeamMembersServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerTeamMember[]> => {
    const members = await getPrisma().teamMember.findMany({
      where: { publicVisible: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        displayName: true,
        roleTitle: true,
        roleTitlesJson: true,
        officerRole: true,
        polesJson: true,
        showDefaultPoleTitles: true,
        pole: true,
        secondaryPolesJson: true,
        personalAe2vEmail: true,
        roleEmail: true,
        isOfficer: true,
        bio: true,
        photoUrl: true,
        mandateYear: true,
        displayOrder: true,
        publicVisible: true,
        userId: true,
      },
    });
    const mapped = members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      roleTitle: member.roleTitle,
      roleTitles: parseTitles(member.roleTitlesJson, member.roleTitle),
      officerRole: member.officerRole,
      poles: effectivePoles(member.polesJson, member.pole, member.secondaryPolesJson),
      showDefaultPoleTitles: member.showDefaultPoleTitles,
      userId: null,
      personalAe2vEmail: member.personalAe2vEmail,
      roleEmail: member.roleEmail,
      isOfficer: member.isOfficer,
      bio: member.bio,
      photoUrl: member.photoUrl,
      mandateYear: member.mandateYear,
      displayOrder: member.displayOrder,
      publicVisible: member.publicVisible,
    }));
    return mapped.length ? mapped : bootstrapTeamMembers();
  },
);

export const getOwnTeamMemberServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerTeamMember | null> => {
    const actor = await getServerActor();
    if (!actor) return null;
    const member =
      (await getPrisma().teamMember.findUnique({ where: { userId: actor.id } })) ??
      (await getPrisma().teamMember.findFirst({
        where: {
          OR: [{ personalAe2vEmail: actor.email }, { roleEmail: actor.email }],
        },
        orderBy: { displayOrder: "asc" },
      })) ??
      (await getPrisma().teamMember.findFirst({
        where: {
          displayName: `${actor.firstName} ${actor.lastName}`,
          userId: null,
        },
        orderBy: { displayOrder: "asc" },
      })) ??
      (actor.roleTitle || actor.role === "PRESIDENT" || actor.role === "TRESORIER"
        ? await getPrisma().teamMember.findFirst({
            where: {
              roleTitle:
                actor.roleTitle ?? (actor.role === "PRESIDENT" ? "Président" : "Trésorière"),
              userId: null,
            },
            orderBy: { displayOrder: "asc" },
          })
        : null);
    if (!member) return null;
    return {
      id: member.id,
      displayName: member.displayName,
      roleTitle: member.roleTitle,
      roleTitles: parseTitles(member.roleTitlesJson, member.roleTitle),
      officerRole: member.officerRole,
      poles: effectivePoles(member.polesJson, member.pole, member.secondaryPolesJson),
      showDefaultPoleTitles: member.showDefaultPoleTitles,
      personalAe2vEmail: member.personalAe2vEmail,
      roleEmail: member.roleEmail,
      isOfficer: member.isOfficer,
      bio: member.bio,
      photoUrl: member.photoUrl,
      mandateYear: member.mandateYear,
      displayOrder: member.displayOrder,
      publicVisible: member.publicVisible,
      userId: member.userId,
    };
  },
);

export const saveTeamMemberServer = createServerFn({ method: "POST" })
  .validator(teamSchema)
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const customTitles = data.roleTitles.filter(
      (title) => title.trim().length > 0 && title.trim() !== "Membre du bureau",
    );
    const showDefaultPoleTitles = customTitles.length > 0 ? data.showDefaultPoleTitles : true;
    const payload = {
      displayName: data.displayName,
      roleTitle: data.roleTitle || data.roleTitles[0] || "Membre du bureau",
      roleTitlesJson: JSON.stringify(data.roleTitles.length ? data.roleTitles : [data.roleTitle]),
      officerRole: data.officerRole ?? null,
      polesJson: JSON.stringify(data.poles),
      showDefaultPoleTitles,
      pole: data.poles[0] ?? null,
      secondaryPolesJson: JSON.stringify(data.poles.slice(1)),
      personalAe2vEmail: data.personalAe2vEmail?.toLowerCase() ?? null,
      roleEmail: data.roleEmail?.toLowerCase() ?? null,
      isOfficer: data.isOfficer,
      bio: data.bio ?? null,
      photoUrl: data.photoUrl ?? null,
      mandateYear: data.mandateYear,
      publicVisible: data.publicVisible,
      userId: data.userId ?? null,
    };
    const member = await prisma.$transaction(async (tx) => {
      const previous = data.id
        ? await tx.teamMember.findUnique({
            where: { id: data.id },
            select: { userId: true, roleTitle: true, pole: true },
          })
        : null;
      const saved = data.id
        ? await tx.teamMember.update({ where: { id: data.id }, data: payload })
        : await tx.teamMember.create({ data: payload });

      // Le titre public et le pôle du profil Bureau doivent rester cohérents avec
      // la carte équipe, sans jamais modifier le rôle de sécurité du compte.
      if (previous?.userId && previous.userId !== saved.userId) {
        await tx.user.updateMany({
          where: { id: previous.userId },
          data: { roleTitle: null, pole: null },
        });
      }
      if (saved.userId) {
        await tx.user.update({
          where: { id: saved.userId },
          data: { roleTitle: saved.roleTitle, pole: saved.pole },
        });
      }
      await tx.auditLog.create({
        data: {
          action: "TEAM_MEMBER_SAVED",
          details: `${saved.id} · ${saved.displayName}`,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
      return saved;
    });
    return { ok: true as const, id: member.id };
  });

export const reorderTeamMembersServer = createServerFn({ method: "POST" })
  .validator(z.object({ ids: z.array(z.string().min(1).max(100)).min(1).max(100) }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    await prisma.$transaction(
      data.ids.map((id, index) =>
        prisma.teamMember.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
    await prisma.auditLog.create({
      data: {
        action: "TEAM_ORDER_CHANGED",
        details: data.ids.join(","),
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return { ok: true as const };
  });

export const deleteTeamMemberServer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    await prisma.$transaction(async (tx) => {
      const member = await tx.teamMember.findUnique({
        where: { id: data.id },
        select: { userId: true },
      });
      if (!member) throw new Response("Membre d’équipe introuvable", { status: 404 });
      if (member.userId) {
        await tx.user.updateMany({
          where: { id: member.userId },
          data: { roleTitle: null, pole: null },
        });
      }
      await tx.teamMember.delete({ where: { id: data.id } });
      await tx.auditLog.create({
        data: {
          action: "TEAM_MEMBER_DELETED",
          details: data.id,
          author: `${actor.firstName} ${actor.lastName}`,
        },
      });
    });
    return { ok: true as const };
  });
