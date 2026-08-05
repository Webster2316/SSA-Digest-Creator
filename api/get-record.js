//fetches individual record to display 
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const sql = neon(process.env.DATABASE_URL);
  try {
    const rows = await sql`
      SELECT id, issue_label, html, archived_at
      FROM digest_archives
      WHERE id = ${id}
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}