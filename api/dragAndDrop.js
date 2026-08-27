import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed"});
    }

    const { files } = req.body;

    const response = await fetch(process.env.POWER_AUTOMATE_FLOW_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ files }),
    });
    
    const result = await response.json();
    res.status(response.status).json(result);
  }