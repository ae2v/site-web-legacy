import { useSession } from "@tanstack/react-start/server";

import { getPrisma } from "@/lib/db";

const developmentSecret = "ae2v-development-only-session-secret-change-me-2026";

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

export type ServerActor = {
  id: string;
  role: "MEMBRE" | "BUREAU" | "TRESORIER" | "PRESIDENT";
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string | null;
};

export async function getServerActor(): Promise<ServerActor | null> {
  // Session API is server-runtime scoped, despite its `use` prefix.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = await useSession<{ userId?: string }>(sessionConfig());
  const userId = session.data.userId;
  if (!userId) return null;

  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, firstName: true, lastName: true, email: true, roleTitle: true },
  });
  return user;
}

export async function requireBureauActor(required: "read" | "write" | "finance" = "read") {
  const actor = await getServerActor();
  if (!actor || !["BUREAU", "TRESORIER", "PRESIDENT"].includes(actor.role)) {
    throw new Response("Accès bureau refusé", { status: 403 });
  }
  if (required === "finance" && !["TRESORIER", "PRESIDENT"].includes(actor.role)) {
    throw new Response("Droit trésorerie requis", { status: 403 });
  }
  return actor;
}
