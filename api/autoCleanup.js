import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect the endpoint so only authorised cron requests can run it
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

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