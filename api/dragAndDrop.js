import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed"});
    }

    const { key, files } = req.body;


    console.log(key)
    //validation / imo optional
    const allowedKeys = [
      "ai-bulletin-data",
      "events-builder-data",
      "ssa-digest-data",
      "posts-draft-data",
    ];
    
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({
        error: "Invalid builder key",
      });
    }
    
    if (!Array.isArray(files)) {
      return res.status(400).json({
        error: "Files must be an array",
      });
    }    

    const response = await fetch(process.env.POWER_AUTOMATE_FLOW_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ key, files }),
    });
    
    const result = await response.json();
    res.status(response.status).json(result);
  }