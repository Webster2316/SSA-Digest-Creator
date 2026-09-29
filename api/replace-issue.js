// api/replace-archived-issue.js
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { archiveId, builderKey } = req.body ?? {};
  if (!Number.isInteger(archiveId) || !builderKey) {
    return res.status(400).json({ error: "archiveId and builderKey are required" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const current = await sql`
      SELECT value FROM digest_data WHERE key = ${builderKey}
    `;
    const data = current[0]?.value;

    if (typeof data?.builtHtml !== "string" || !data.builtHtml.trim()) {
      return res.status(400).json({ error: "No saved HTML to archive" });
    }

    const issueLabel =
      data.issueRange || data.greeting || data.issueTag || "Untitled";

    const updated = await sql`
      UPDATE digest_archives
      SET html = ${data.builtHtml},
          issue_label = ${issueLabel}
      WHERE id = ${archiveId}
        AND builder_key = ${builderKey}
      RETURNING id, issue_label
    `;

    if (!updated.length) {
      return res.status(404).json({ error: "Archived issue not found" });
    }

    return res.status(200).json({ ok: true, issue: updated[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}