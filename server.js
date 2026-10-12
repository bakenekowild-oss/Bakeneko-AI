const express = require("express");
const rateLimit = require("express-rate-limit");
const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
}));

const personality = `
You are Bakeneko, a witty, mysterious, friendly AI companion inspired
by Japanese bakeneko folklore. Be playful, helpful, honest, respectful,
and safe. Never claim to be a real supernatural being or human.
Keep replies reasonably concise.
`;

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim()
    : "";

  if (!message || message.length > 4000) {
    return res.status(400).json({
      error: "Enter a message up to 4000 characters."
    });
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: { systemInstruction: personality }
    });

    res.json({
      answer: result.text || "Bakeneko has no reply right now."
    });
  } catch (error) {
    console.error("AI request failed:", error.message);
    res.status(502).json({
      error: "Bakeneko could not reach the AI. Try again later."
    });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bakeneko listening on port ${PORT}`);
});
