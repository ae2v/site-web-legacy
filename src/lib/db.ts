import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance;
  if (globalThis.prismaGlobal) {
    prismaInstance = globalThis.prismaGlobal;
    return globalThis.prismaGlobal;
  }

  const connectionString =
    process.env["POSTGRES_URL"] ||
    process.env["PRISMA_DATABASE_URL"] ||
    process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error(
      "Database configuration is missing. Set POSTGRES_URL, PRISMA_DATABASE_URL or DATABASE_URL.",
    );
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
  if (process.env["NODE_ENV"] !== "production") {
    globalThis.prismaGlobal = prismaInstance;
  }
  return prismaInstance;
}
