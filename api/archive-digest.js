//saves all issues 
import { neon } from '@neondatabase/serverless';

const KEY_GROUPS = {
  weekly: ['ssa-digest-data', 'training-bulletin-data'],
  monthly: ['ai-bulletin-data']
}

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const results = [];

  const group = req.query.group;
  const keys = KEY_GROUPS[group];

  if (!keys) {
    return res.status(400).json({error: "Missing or invalid group parameters"})
  };

  try {
    for (const key of keys) {
      const rows = await sql`SELECT value FROM digest_data WHERE key = ${key}`;
      const data = rows[0]?.value;
      if (!data || !data.builtHtml) {
        results.push({ key, skipped: true, reason: 'no data or no builtHtml' });
        continue;
      }

      const issueLabel = data.issueRange || data.greeting || data.issueTag || 'Untitled';

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
