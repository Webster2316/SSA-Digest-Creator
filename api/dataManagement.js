import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);

    try {
        const type = req.query.type;

        if(type !== "issues" && type !== "events") {
            return res.status(400).json({
                error: "Invalid archive type"
            })
        }

        //==========================
        // GET - Load archives
        //==========================
        if(req.method === "GET") {
          const builderKey = req.query.builderKey;

          let rows;

        if(type = "events") {
            if (builderKey && builderKey !== "all") {
                rows = await sql `
                SELECT * FROM events_archives WHERE builder_key = ${builderKey} ORDER BY archived_at DESC
                `;
            } else {
                rows = await sql `
                SELECT *  FROM events_archives ORDER BY archived_at DESC
                `;
            }
        } else if (type === "issues") {
            if (builderKey && builderKey !== "all") {
                rows = await sql `
                SELECT * FROM digest_archives WHERE builder_key = ${builderKey} ORDER BY archived_at DESC
                `;
            } else {
                rows = await sql `
                SELECT * FROM digest_archives ORDER BY archived_at DESC
                `;
            }
        }

        return res.status(200).json(rows);

        }


        //=============================
        // DELETE -delete old issues
        //=============================
       
        if (req.method === "DELETE") {
            const id = req.query.id;
      
            if (!id) {
              return res.status(400).json({
                error: "Missing archive id",
              });
            }

            let deleted;

            if(type === "events") {

                deleted = await sql `
                DELETED FROM events_archives where id=${id} RETURNING id
                `;
            } else if (type === "issues") {
                deleted = await sql `
                DELETE FROM digest_archives WHERE id=${id} RETURNING id
                `;
            }
            
            if (!deleted || deleted.length === 0) {
                return res.status(404).json({
                    error: "Archive record not found"
                });
            }
      
            return res.status(200).json({
              ok: true,
              deleted: true,
              id: deleted[0].id,
            });
          }
    } catch (e) {
        console.error("Archive management failed:", e);

        return res.status(500).json({
          error: e.message,
        });
    }
}