import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const connectionString = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL;
if (!connectionString) throw new Error("Missing database connection string");

const output = process.argv[2];
if (!output) throw new Error("Usage: node scripts/backup-db.mjs <output>");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const tables = await client.query(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const snapshot = { createdAt: new Date().toISOString(), schema: "public", tables: {} };
  for (const { tablename } of tables.rows) {
    const result = await client.query({
      text: `SELECT * FROM public."${tablename.replaceAll('"', '""')}"`,
    });
    snapshot.tables[tablename] = { rowCount: result.rowCount, rows: result.rows };
  }
  const target = path.resolve(output);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(snapshot), { encoding: "utf8", flag: "wx" });
  const stat = await fs.stat(target);
  console.log(
    JSON.stringify({
      ok: true,
      file: target,
      bytes: stat.size,
      tables: Object.fromEntries(
        Object.entries(snapshot.tables).map(([name, value]) => [name, value.rowCount]),
      ),
    }),
  );
} finally {
  await client.end();
}
