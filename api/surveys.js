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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
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


async function recordResponse(req, res, sql) {
  const surveyId = Number(req.query.surveyId);
  const answer = req.query.answer;

  if (
    !Number.isSafeInteger(surveyId) ||
    surveyId < 1 ||
    typeof answer !== "string"
  ) {
    return res.status(400).send("Invalid survey response");
  }

  if (!ALLOWED_ANSWERS.includes(answer)) {
    return res.status(400).send("Invalid answer");
  }

  try {
    const [survey] = await sql`
      SELECT id, title
      FROM surveys
      WHERE id = ${surveyId}
    `;

    if (!survey) {
      return res.status(404).send("Survey not found");
    }

    const isYes = answer === "Yes";
    const answerLabel = isYes
      ? "Yes, I will be attending"
      : "No, I will not be attending";
    const answerColor = isYes ? "#167D66" : "#C34D4D";

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <title>Confirm Attendance | SSA</title>
        </head>

        <body style="
          margin:0;
          padding:0;
          background-color:#f3f4f8;
          font-family:Arial,Helvetica,sans-serif;
          color:#29264b;
        ">

          <div style="
            min-height:100vh;
            box-sizing:border-box;
            padding:40px 16px;
            display:flex;
            align-items:center;
            justify-content:center;
          ">

            <div style="
              width:100%;
              max-width:460px;
              background-color:#ffffff;
              border:1px solid #e5e3ee;
              border-radius:14px;
              overflow:hidden;
              box-shadow:0 8px 28px rgba(40,30,126,0.07);
            ">

              <!-- SSA Header -->
              <div style="
                padding:24px 28px;
                background-color:#281e7e;
                text-align:center;
              ">
                <img
                  src="https://raw.githubusercontent.com/Webster2316/SSA-Digest-Creator/786c7c8a8272d594be20ad4a9e1a159363ce0002/Logo/SSA%20logo.png"
                  alt="SSA Logo"
                  width="120"
                  style="
                    display:block;
                    width:120px;
                    max-width:100%;
                    height:auto;
                    margin:0 auto;
                  "
                >
              </div>

              <!-- Form Content -->
              <div style="padding:32px 28px 30px;">

                <p style="
                  margin:0 0 10px;
                  color:#77718f;
                  font-size:12px;
                  font-weight:bold;
                  letter-spacing:1.2px;
                  text-transform:uppercase;
                ">
                  Event Confirmation
                </p>

                <h1 style="
                  margin:0 0 12px;
                  color:#281e7e;
                  font-size:25px;
                  line-height:1.3;
                  font-weight:700;
                ">
                  Confirm Your Attendance
                </h1>

                <p style="
                  margin:0 0 22px;
                  color:#666477;
                  font-size:14px;
                  line-height:1.7;
                ">
                  Please provide your email address so we can record
                  your response for attendance tracking purposes.
                </p>

                <!-- Event Details -->
                <div style="
                  margin-bottom:24px;
                  padding:16px;
                  background-color:#f7f5fc;
                  border:1px solid #e8e2f5;
                  border-radius:8px;
                ">
                  <p style="
                    margin:0 0 6px;
                    color:#77718f;
                    font-size:12px;
                  ">
                    Event
                  </p>

                  <p style="
                    margin:0 0 14px;
                    color:#281e7e;
                    font-size:16px;
                    line-height:1.5;
                    font-weight:bold;
                  ">
                    ${escapeHtml(survey.title)}
                  </p>

                  <p style="
                    margin:0 0 8px;
                    color:#77718f;
                    font-size:12px;
                  ">
                    Your selected response
                  </p>

                  <span style="
                    display:inline-block;
                    padding:7px 11px;
                    background-color:${answerColor};
                    color:#ffffff;
                    border-radius:5px;
                    font-size:12px;
                    font-weight:bold;
                  ">
                    ${answerLabel}
                  </span>
                </div>

                <form method="POST" action="/api/surveys">

                  <input
                    type="hidden"
                    name="surveyId"
                    value="${surveyId}"
                  >

                  <input
                    type="hidden"
                    name="answer"
                    value="${answer}"
                  >

                  <label for="email" style="
                    display:block;
                    margin-bottom:8px;
                    color:#34314f;
                    font-size:13px;
                    font-weight:bold;
                  ">
                    Email Address
                  </label>

                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    maxlength="254"
                    autocomplete="email"
                    placeholder="Enter your email address"
                    style="
                      display:block;
                      width:100%;
                      box-sizing:border-box;
                      padding:13px 14px;
                      border:1px solid #d8d5e3;
                      border-radius:7px;
                      background-color:#ffffff;
                      color:#29264b;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:14px;
                      outline-color:#83479d;
                    "
                  >

                  <p style="
                    margin:9px 0 22px;
                    color:#858296;
                    font-size:12px;
                    line-height:1.6;
                  ">
                    Your email will be used to associate your response
                    with this event.
                  </p>

                  <button
                    type="submit"
                    style="
                      display:block;
                      width:100%;
                      padding:14px 18px;
                      border:0;
                      border-radius:7px;
                      background-color:#281e7e;
                      color:#ffffff;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:14px;
                      font-weight:bold;
                      cursor:pointer;
                    "
                  >
                    Submit Response
                  </button>

                </form>

              </div>

            </div>
          </div>

        </body>
      </html>
    `);
  } catch (error) {
    console.error("Could not display confirmation form:", error);
    return res.status(500).send("Could not load the confirmation form. Please try again.");
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
