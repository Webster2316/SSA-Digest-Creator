import { neon } from '@neondatabase/serverless';


export default async function handler(req, res) {
if (req.method !== "POST" || "GET") {
    return res.status(405).json({ error: "Method not allowed"})
}

  const sql = neon(process.env.DATABASE_URL);


  const {builderKey, event } = req.body;

  if (!builderKey || !event?.id) {
    return res.status(400).json({ 
        error: "Missing Key or event"
    })
  }
  try {
      await sql`
      INSERT INTO events_archives (builder_key, title, event_data)
      VALUES (${builderKey}, ${event.title ?? "Untitled Event"}, ${JSON.stringify(event)});
    `;
   return res.status(200).json({ ok: true, archived: true });
  } catch (e) {
    console.error("Archive event failed:", e);

    return res.status(500).json({
      error: e.message,
    });
  }
}
