import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === "GET") return recordResponse(req, res, sql);
  if (req.method === "POST") return createSurvey(req, res, sql);
  if (req.method === "DELETE") return deleteSurvey(req.res, sql); 

  res.setHeader("Allow", "GET, POST");
  return res.status(405).send("Method not allowed");
}
const ALLOWED_ANSWERS = ["Yes", "No"];

async function recordResponse(req, res, sql) {
  const surveyId = Number(req.query.surveyId);
  const answer = req.query.answer;

  if (!Number.isSafeInteger(surveyId) || surveyId < 1 || typeof answer !== "string") {
    return res.status(400).send("Invalid survey response");
  }

  if (!ALLOWED_ANSWERS.includes(answer)) {
    return res.status(400).send("Invalid answer");
  }

  try {
    const [survey] = await sql`
      SELECT id FROM surveys WHERE id = ${surveyId}
    `;

    if (!survey) return res.status(404).send("Survey not found");

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

async function createSurvey(req, res, sql) {
  const title = req.body?.title;

  if (!title) return res.status(400).send("Missing title");

  try {
    const [survey] = await sql`
      INSERT INTO surveys (title)
      VALUES (${title})
      RETURNING id
    `;

    return res.status(201).json({ success: true, surveyId: survey.id });
  } catch (error) {
    console.error("Could not create survey:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteSurvey(req,res,sql) {
    const surveyId = Number(req.query.surveyId);

    if (!Number.isSafeInteger(surveyId) || surveyId < 1) {
        return res.status(400).send("Missing or invalid survey ID");
      }
    
try {
 await sql`
      DELETE FROM survey_responses
      WHERE survey_id = ${surveyId}
    `;

    // Then delete the survey
    const result = await sql`
      DELETE FROM surveys
      WHERE id = ${surveyId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).send("Survey not found");
    }

    return res.status(200).json({
        success: true,
        message: "Survey deleted successfully",
      });
} catch(error) {
    console.error("Could not save survey response:", error);
    return res.status(500).send("Could not save your response. Please try again.");
}
}