import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.POSTGRES_URL,
  },
  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});
