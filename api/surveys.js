import {neon} from "@neondatabase/serverless";


export default  async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const Title = req.body?.title

    if(!Title) {
        return res.status(400).send("Misisng title");
    }

    const sql = neon(process.env.DATABASE_URL);
    try {

        await sql`
        iNSERT INTO surveys(title)
        VALUES (${Title})
        `

        return res.status(201).json({
            success: true,
            surveyId: survey.id
        });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
}