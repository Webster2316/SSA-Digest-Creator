//saves all issues 
import { neon } from '@neondatabase/serverless';

const BUILDER_KEYS = ['ssa-digest-data', 'training-bulletin-data'];

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const results = [];

  try {
    for (const key of BUILDER_KEYS) {
      const rows = await sql`SELECT value FROM digest_data WHERE key = ${key}`;
      const data = rows[0]?.value;
      if (!data || !data.builtHtml) {
        results.push({ key, skipped: true, reason: 'no data or no builtHtml' });
        continue;
      }

      const issueLabel = data.issueRange || data.greeting || 'Untitled';

      await sql`
        INSERT INTO digest_archives (builder_key, issue_label, html)
        VALUES (${key}, ${issueLabel}, ${data.builtHtml})
      `;
      results.push({ key, archived: true });
    }

    res.status(200).json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}