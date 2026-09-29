import { neon } from '@neondatabase/serverless';

export default function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).send("Method not allowed");
    }
  
    const answer =
      req.method === "GET" ? req.query.answer : req.body?.answer;
  
    console.log("Survey test received:", {
      method: req.method,
      answer,
      receivedAt: new Date().toISOString(),
    });
  
    if (!answer) {
      return res.status(400).send("No answer was received.");
    }
  
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!doctype html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 32px;">
          <h2>Thank you for your response.</h2>
          <p>Your test submission was received.</p>
        </body>
      </html>
    `);
  }