import { neon } from "@neondatabase/serverless";

const KEY_GROUPS = {
  weekly: ["ssa-digest-data"],
  monthly: ["ai-bulletin-data", "training-bulletin-data", "events-builder-data"],
};

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  switch (req.query.type) {
    case "record":
      return getRecord(req, res, sql);
    case "list":
      return listRecord(req, res, sql);
    case "archive":
      return saveIssue(req, res, sql);
    case "events":
      return eventArchive(req, res, sql, { field: "event", titleField: "title" });
    case "program":
      return eventArchive(req, res, sql, { field: "programmes", titleField: "eventName" });
    default:
      return res.status(400).json({ error: "Missing or invalid type" });
  }
}

//Digest history

async function getRecord(req, res, sql) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const rows = await sql`
      SELECT id, issue_label, html, archived_at
      FROM digest_archives
      WHERE id = ${id}
    `;
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function listRecord(req, res, sql) {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Missing key" });

  try {
    const rows = await sql`
      SELECT id, issue_label, archived_at
      FROM digest_archives
      WHERE builder_key = ${key}
      ORDER BY archived_at DESC
    `;
    return res.status(200).json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function saveIssue(req, res, sql) {
  const keys = KEY_GROUPS[req.query.group];
  if (!keys) {
    return res.status(400).json({ error: "Missing or invalid group parameter" });
  }

  const results = [];

  try {
    for (const key of keys) {
      const rows = await sql`SELECT value FROM digest_data WHERE key = ${key}`;
      const data = rows[0]?.value;

      if (!data || !data.builtHtml) {
        results.push({ key, skipped: true, reason: "no data or no builtHtml" });
        continue;
      }

      const issueLabel = data.issueRange || data.greeting || data.issueTag || "Untitled";

      await sql`
        INSERT INTO digest_archives (builder_key, issue_label, html)
        VALUES (${key}, ${issueLabel}, ${data.builtHtml})
      `;
      results.push({ key, archived: true });
    }

    return res.status(200).json({ ok: true, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/* ---------- Events + programme history api ---------- */

async function eventArchive(req, res, sql, { field, titleField }) {
  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: "Missing builder key" });

      const rows = await sql`
        SELECT id, builder_key, title, event_data, archived_at
        FROM events_archives
        WHERE builder_key = ${key}
        ORDER BY archived_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const builderKey = req.body?.builderKey;
      const item = req.body?.[field];

      if (!builderKey || !item?.id) {
        return res.status(400).json({ error: `Missing builderKey or ${field}` });
      }

      await sql`
        INSERT INTO events_archives (builder_key, title, event_data)
        VALUES (
          ${builderKey},
          ${item[titleField] ?? "Untitled Event"},
          ${JSON.stringify(item)}
        )
      `;
      return res.status(200).json({ ok: true, archived: true });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing archive id" });

      const deleted = await sql`
        DELETE FROM events_archives
        WHERE id = ${id}
        RETURNING id
      `;
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Archived event not found" });
      }
      return res.status(200).json({ ok: true, deleted: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Event history API failed:", e);
    return res.status(500).json({ error: e.message });
  }
}