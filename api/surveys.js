import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === "GET") { return req.query.view === "responses" ? viewResponses(req, res, sql) : recordResponse(req, res, sql); }
  if (req.method === "POST") {
    if (req.headers["content-type"]?.includes("application/json")) {
      return createSurvey(req, res, sql);
    }
  
    return submitResponse(req, res, sql);
  }
  if (req.method === "DELETE") return deleteSurvey(req, res, sql); 

  res.setHeader("Allow", "GET, POST");
  return res.status(405).send("Method not allowed");
}
const ALLOWED_ANSWERS = ["Yes", "No"];



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

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">c
        </head>
        <body style="font-family:Arial,sans-serif;padding:32px;max-width:480px;margin:auto">

        <div style="margin-bottom:24px;text-align:center;">
          <img
            src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
            alt="SSA Logo"
            style="display:block;width:auto;height:48px;max-width:180px;margin:0 auto 20px;"
          />
      
          <h2 style="margin:0 0 12px;color:#241e42;font-size:24px;">
            Confirm Your Attendance
          </h2>
      
          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            Please enter your email address for attendance tracking purposes.
          </p>
        </div>
      
        <form method="POST" action="/api/surveys">
      
          <input type="hidden" name="surveyId" value="${surveyId}">
          <input type="hidden" name="answer" value="${answer}">
      
          <label for="email" style="display:block;font-size:14px;font-weight:bold;margin-bottom:8px;color:#333;">
            Email address
          </label>
      
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:0 0 20px;border:1px solid #ccc;border-radius:6px;font-size:14px;"
          >
      
          <button
            type="submit"
            style="background:#167D66;color:white;padding:12px 24px;border:0;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold;width:100%;"
          >
            Submit Response
          </button>
      
        </form>
      
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Could not save survey response:", error);
    return res.status(500).send("Could not save your response. Please try again.");
  }
}

async function submitResponse(req, res, sql) {
  const surveyId = Number(req.body?.surveyId);
  const answer = req.body?.answer;
  const email = req.body?.email?.trim();

  if (
    !Number.isSafeInteger(surveyId) ||
    surveyId < 1 ||
    !ALLOWED_ANSWERS.includes(answer) ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).send("Please provide a valid email and response.");
  }

  try {
    const [survey] = await sql`
      SELECT id FROM surveys WHERE id = ${surveyId}
    `;

    if (!survey) {
      return res.status(404).send("Survey not found.");
    }

    await sql`
      INSERT INTO survey_responses (
        survey_id,
        answer,
        email
      )
      VALUES (
        ${surveyId},
        ${answer},
        ${email}
      )
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
      <!doctype html>
      <html>
        <body style="font-family:Arial,sans-serif;padding:32px">
          <h2>Thank you for your response.</h2>
          <p>Your answer has been recorded successfully.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Could not save survey response:", error);
    return res.status(500).send("Could not save your response. Please try again.");
  }
}

async function viewResponses(req, res, sql) {
  const surveyId = Number(req.query.surveyId);

  if (!Number.isSafeInteger(surveyId) || surveyId < 1) {
    return res.status(400).json({ error: "Invalid survey ID" });
  }

  try {
    const [survey] = await sql`
      SELECT id, title
      FROM surveys
      WHERE id = ${surveyId}
    `;

    if (!survey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    const responses = await sql`
      SELECT answer, email
      FROM survey_responses
      WHERE survey_id = ${surveyId}
      ORDER BY answer
    `;

    const yesCount = responses.filter(
      (response) => response.answer === "Yes"
    ).length;

    const noCount = responses.filter(
      (response) => response.answer === "No"
    ).length;

    return res.status(200).json({
      title: survey.title,
      total: responses.length,
      yesCount,
      noCount,
      responses,
    });
  } catch (error) {
    console.error("Could not retrieve responses:", error);
    return res.status(500).json({
      error: "Could not retrieve responses",
    });
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
