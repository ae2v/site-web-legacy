import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  const result = await client.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE "personalAe2vEmail" IS NOT NULL)::int AS personal,
      count(*) FILTER (WHERE "roleEmail" IS NOT NULL)::int AS role
    FROM public."TeamMember"
    WHERE "publicVisible" = true
  `);
  console.log(JSON.stringify(result.rows[0]));
} finally {
  await client.end();
}
