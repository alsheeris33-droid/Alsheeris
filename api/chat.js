// Vercel serverless function - keeps Groq API key secret
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GROQ_KEY = process.env.GROQ_KEY;
  if (!GROQ_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { messages } = req.body;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_KEY
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
