import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // ==========================================
    // GET — LOAD EVENT HISTORY
    // ==========================================
    if (req.method === "GET") {
      const key = req.query.key;

      if (!key) {
        return res.status(400).json({
          error: "Missing builder key",
        });
      }

      const rows = await sql`
        SELECT
          id,
          builder_key,
          title,
          event_data,
          archived_at
        FROM events_archives
        WHERE builder_key = ${key}
        ORDER BY archived_at DESC
      `;

      return res.status(200).json(rows);
    }

    // ==========================================
    // POST — ARCHIVE EVENT
    // ==========================================
    if (req.method === "POST") {
      const { builderKey, event } = req.body;

      if (!builderKey || !event?.id) {
        return res.status(400).json({
          error: "Missing builderKey or event",
        });
      }

      await sql`
        INSERT INTO events_archives (
          builder_key,
          title,
          event_data
        )
        VALUES (
          ${builderKey},
          ${event.title ?? "Untitled Event"},
          ${JSON.stringify(event)}
        )
      `;

      return res.status(200).json({
        ok: true,
        archived: true,
      });
    }

    // ==========================================
    // DELETE — REMOVE FROM HISTORY / RESTORE
    // ==========================================
    if (req.method === "DELETE") {
      const id = req.query.id;

      if (!id) {
        return res.status(400).json({
          error: "Missing archive id",
        });
      }

      const deleted = await sql`
        DELETE FROM events_archives
        WHERE id = ${id}
        RETURNING id
      `;

      if (deleted.length === 0) {
        return res.status(404).json({
          error: "Archived event not found",
        });
      }

      return res.status(200).json({
        ok: true,
        deleted: true,
      });
    }

    // Anything else
    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (e) {
    console.error("Event history API failed:", e);

    return res.status(500).json({
      error: e.message,
    });
  }
}