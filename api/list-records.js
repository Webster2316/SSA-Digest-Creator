//fetches all records by key/ builder type
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  const sql = neon(process.env.DATABASE_URL);
  try {
    const rows = await sql`
      SELECT id, issue_label, archived_at
      FROM digest_archives
      WHERE builder_key = ${key}
      ORDER BY archived_at DESC
    `;
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}