import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const surveyId = Number(req.query.surveyId);
  const answer = req.query.answer;

  if (!Number.isSafeInteger(surveyId) || surveyId < 1 || typeof answer !== "string") {
    return res.status(400).send("Invalid survey response");
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const [survey] = await sql`
      SELECT choices FROM surveys WHERE id = ${surveyId}
    `;

    if (!survey) return res.status(404).send("Survey not found");

    if (!Array.isArray(survey.choices) || !survey.choices.includes(answer)) {
      return res.status(400).send("Invalid answer");
    }

    await sql`
      INSERT INTO survey_responses (survey_id, answer)
      VALUES (${surveyId}, ${answer})
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!doctype html>
      <html>
        <body style="font-family:Arial,sans-serif;padding:32px">
          <h2>Thank you for your response.</h2>
          <p>Your answer has been recorded.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Could not save survey response:", error);
    return res.status(500).send("Could not save your response. Please try again.");
  }
}