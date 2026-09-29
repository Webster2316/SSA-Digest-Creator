// api/replace-archived-issue.js
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = req.query.key;
  if (key !== "ssa-digest-data") {
    return res.status(400).json({ error: "Invalid builder key" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const current = await sql`
      SELECT value FROM digest_data WHERE key = ${key}
    `;
    const data = current[0]?.value;

    if (typeof data?.builtHtml !== "string" || !data.builtHtml.trim()) {
      return res.status(400).json({ error: "No saved HTML to archive" });
    }

    const issueLabel =
      data.issueRange || data.greeting || data.issueTag || "Untitled";

    const updated = await sql`
      UPDATE digest_archives
      SET html = ${data.builtHtml}
      WHERE id = (
        SELECT id
        FROM digest_archives
        WHERE builder_key = ${key}
          AND issue_label = ${issueLabel}
        ORDER BY archived_at DESC, id DESC
        LIMIT 1
      )
      AND builder_key = ${key}
      RETURNING id, issue_label
    `;

    if (!updated.length) {
      return res.status(404).json({
        error: `No archived issue matches "${issueLabel}"`,
      });
    }

    return res.status(200).json({ ok: true, issue: updated[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}