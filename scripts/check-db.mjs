import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  const out = {};
  for (const table of ["Membership", "EventRegistration", "Payment", "OrderLine", "EmailLog"]) {
    const result = await client.query(`SELECT count(*)::int AS count FROM public."${table}"`);
    out[table] = result.rows[0].count;
  }
  const team = await client.query(`
    SELECT
      count(*) FILTER (WHERE "publicVisible" = true)::int AS public_count,
      count(*) FILTER (WHERE "publicVisible" = false)::int AS hidden_count
    FROM public."TeamMember"
  `);
  out.TeamMember = team.rows[0];
  const columns = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Dossier'
      AND column_name IN ('emailUnsubscribedAt', 'emailPreferenceToken')
    ORDER BY column_name
  `);
  out.DossierPreferenceColumns = columns.rows.map((row) => row.column_name);
  const users = await client.query(`SELECT count(*)::int AS count FROM public."User"`);
  out.UserCount = users.rows[0].count;
  const teamEmails = await client.query(`
    SELECT count(*)::int AS invalid_count
    FROM public."TeamMember"
    WHERE "publicVisible" = true
      AND ("personalAe2vEmail" IS NULL OR lower("personalAe2vEmail") NOT LIKE '%@ae2v.fr')
  `);
  out.PublicTeamInvalidEmails = teamEmails.rows[0].invalid_count;
  const events = await client.query(`
    SELECT id, "tiersJson"
    FROM public."Event"
  `);
  const tierIssues = [];
  for (const event of events.rows) {
    let tiers = [];
    try {
      const parsed = JSON.parse(event.tiersJson);
      tiers = Array.isArray(parsed) ? parsed : [];
    } catch {
      tierIssues.push(`${event.id}: JSON tarifs invalide`);
      continue;
    }
    for (const audience of ["public", "adherent", "bureau"]) {
      if (!tiers.some((tier) => tier?.audience === audience)) {
        tierIssues.push(`${event.id}: tarif système ${audience} absent`);
      }
    }
    if (
      tiers.some((tier) =>
        String(tier?.label ?? "")
          .toLowerCase()
          .includes("compte étudiant"),
      )
    ) {
      tierIssues.push(`${event.id}: tarif compte étudiant présent`);
    }
  }
  out.EventTierIssues = tierIssues;
  const invoiceLinks = await client.query(`
    SELECT
      count(*) FILTER (WHERE i.id IS NOT NULL)::int AS invoices_with_payment,
      count(*) FILTER (WHERE i.id IS NULL)::int AS payments_without_invoice
    FROM public."Payment" p
    LEFT JOIN public."Invoice" i ON i.id = p."invoiceId"
    WHERE p.status IN ('CONFIRME', 'PARTIELLEMENT_REMBOURSE', 'REMBOURSE')
  `);
  out.PaidPaymentInvoiceLinks = invoiceLinks.rows[0];
  console.log(JSON.stringify(out));
} finally {
  await client.end();
}
