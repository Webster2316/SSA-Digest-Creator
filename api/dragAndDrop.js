import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    const testPayload = {
      files: [
        {
          filename: "test.pdf",
          contentType: "application/pdf",
          contentBytes: "dGVzdA=="
        }
      ]
    };
  
    const response = await fetch(process.env.POWER_AUTOMATE_FLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });
  
    const result = await response.json();
    res.status(response.status).json(result);
  }