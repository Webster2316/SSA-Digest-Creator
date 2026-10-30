import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.query.action === "cleanup") return autoCleanUp(req, res, sql);
  return dataManager(req, res, sql);
}

/* ---------- Archive list / delete ---------- */

async function dataManager(req, res, sql) {
  const { type, builderKey, id } = req.query;

  if (type !== "issues" && type !== "events") {
    return res.status(400).json({ error: "Invalid archive type" });
  }

  try {
    if (req.method === "GET") {
      const filtered = builderKey && builderKey !== "all";
      let rows;

      if (type === "events") {
        rows = filtered
          ? await sql`SELECT * FROM events_archives WHERE builder_key = ${builderKey} ORDER BY archived_at DESC`
          : await sql`SELECT * FROM events_archives ORDER BY archived_at DESC`;
      } else {
        rows = filtered
          ? await sql`SELECT * FROM digest_archives WHERE builder_key = ${builderKey} ORDER BY archived_at DESC`
          : await sql`SELECT * FROM digest_archives ORDER BY archived_at DESC`;
      }

      return res.status(200).json(rows);
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ error: "Missing archive id" });

      const deleted =
        type === "events"
          ? await sql`DELETE FROM events_archives WHERE id = ${id} RETURNING id`
          : await sql`DELETE FROM digest_archives WHERE id = ${id} RETURNING id`;

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Archive record not found" });
      }

      return res.status(200).json({ ok: true, deleted: true, id: deleted[0].id });
    }

    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Archive management failed:", e);
    return res.status(500).json({ error: e.message });
  }
}

/* ---------- Cron cleanup ---------- */

async function autoCleanUp(req, res, sql) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only authorised cron requests may run this
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const deletedDigest = await sql`
      DELETE FROM digest_archives
      WHERE archived_at < NOW() - INTERVAL '2 years'
      RETURNING id
    `;

    const deletedEvents = await sql`
      DELETE FROM events_archives
      WHERE archived_at < NOW() - INTERVAL '2 years'
      RETURNING id
    `;

    return res.status(200).json({
      ok: true,
      digestArchivesDeleted: deletedDigest.length,
      eventArchivesDeleted: deletedEvents.length,
    });
  } catch (e) {
    console.error("Archive cleanup failed:", e);
    return res.status(500).json({ error: "Archive cleanup failed" });
  }
}