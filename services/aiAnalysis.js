// ============================================================
//  services/aiAnalysis.js — Chart Analysis Engine
//  Primary: Anthropic Claude Vision
//  Fallback: OpenRouter (Claude → GPT-4o)
//  DET Trades | Dark Empire Technologies
// ============================================================

const axios = require("axios");
const fs = require("fs");
const config = require("../config");

// ── Build the analysis prompt ─────────────────────────────
function buildPrompt(pair, accountBalance, riskPercent, plan) {
  const isPremium = plan === "weekly" || plan === "monthly";
  const riskInfo = accountBalance && riskPercent
    ? `\nAccount Balance: $${accountBalance}\nRisk Percentage: ${riskPercent}%\nCalculate the exact lot size based on the stop loss distance.`
    : "";

  return `You are an expert professional forex trader and technical analyst working for DET Trades by Dark Empire Technologies.

Analyze the provided chart screenshots (4H timeframe and 15M timeframe) for ${pair.toUpperCase()}.

${riskInfo}

Respond ONLY with a valid JSON object in this exact structure — no markdown, no extra text:

{
  "pair": "${pair.toUpperCase()}",
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "bias_strength": "STRONG" | "MODERATE" | "WEAK",
  "entry_zone": {
    "from": 0.00000,
    "to": 0.00000,
    "description": "brief entry description"
  },
  "stop_loss": {
    "price": 0.00000,
    "pips": 0,
    "description": "brief SL reasoning"${isPremium ? `,\n    "lot_size": 0.00,\n    "risk_amount": 0.00` : ""}
  },
  "tp1": {
    "price": 0.00000,
    "pips": 0,
    "rr_ratio": "1:0.0"
  }${isPremium ? `,
  "tp2": {
    "price": 0.00000,
    "pips": 0,
    "rr_ratio": "1:0.0"
  },
  "tp3": {
    "price": 0.00000,
    "pips": 0,
    "rr_ratio": "1:0.0"
  }` : ""}${isPremium ? `,
  "reasoning": {
    "4h_analysis": "detailed 4H structure analysis",
    "15m_analysis": "detailed 15M entry confirmation analysis",
    "key_levels": ["level 1 description", "level 2 description"],
    "confluence_factors": ["factor 1", "factor 2", "factor 3"],
    "invalidation": "what would invalidate this trade setup"
  }` : ""},
  "market_session": "LONDON" | "NEW_YORK" | "ASIAN" | "OVERLAP" | "OFF_HOURS",
  "confidence_score": 0,
  "risk_warning": "brief risk disclaimer"
}

Be precise with price levels. Base your analysis on price action, market structure, BOS (Break of Structure), CHoCH (Change of Character), FVG (Fair Value Gaps), order blocks, and key support/resistance. Do not guess — only provide a setup if there is genuine confluence.`;
}

// ── Convert image file to base64 ──────────────────────────
function imageToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

// ── Call Anthropic API ────────────────────────────────────
async function callAnthropic(prompt, image4hPath, image15mPath) {
  if (!config.AI.ANTHROPIC_API_KEY || config.AI.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_API_KEY") {
    throw new Error("Anthropic API key not configured");
  }

  const image4hB64 = imageToBase64(image4hPath);
  const image15mB64 = imageToBase64(image15mPath);

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: config.AI.ANTHROPIC_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image4hB64 },
            },
            {
              type: "text",
              text: "This is the 4H (4-hour) timeframe chart.",
            },
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: image15mB64 },
            },
            {
              type: "text",
              text: "This is the 15M (15-minute) timeframe chart.",
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    },
    {
      headers: {
        "x-api-key": config.AI.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  return response.data.content[0].text;
}

// ── Call OpenRouter API (fallback) ────────────────────────
async function callOpenRouter(prompt, image4hPath, image15mPath, useSecondaryModel = false) {
  const image4hB64 = imageToBase64(image4hPath);
  const image15mB64 = imageToBase64(image15mPath);
  const model = useSecondaryModel ? config.AI.OPENROUTER_FALLBACK_MODEL : config.AI.OPENROUTER_MODEL;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image4hB64}` },
            },
            {
              type: "text",
              text: "This is the 4H (4-hour) timeframe chart.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image15mB64}` },
            },
            {
              type: "text",
              text: "This is the 15M (15-minute) timeframe chart.",
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.AI.OPENROUTER_API_KEY}`,
        "HTTP-Referer": config.APP.DOMAIN,
        "X-Title": "DET Trades",
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
}

// ── Parse AI JSON response ────────────────────────────────
function parseAnalysisResponse(rawText) {
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

// ── Main Analysis Function (with fallback chain) ──────────
async function analyzeChart({ pair, image4hPath, image15mPath, accountBalance, riskPercent, plan }) {
  const prompt = buildPrompt(pair, accountBalance, riskPercent, plan);
  let rawText = null;
  let provider = "anthropic";

  // Try Anthropic first
  try {
    rawText = await callAnthropic(prompt, image4hPath, image15mPath);
    console.log(`✅ Analysis via Anthropic for ${pair}`);
  } catch (err) {
    console.warn(`⚠️ Anthropic failed: ${err.message} — trying OpenRouter (Claude)`);
    provider = "openrouter_claude";

    // Fallback 1: OpenRouter with Claude model
    try {
      rawText = await callOpenRouter(prompt, image4hPath, image15mPath, false);
      console.log(`✅ Analysis via OpenRouter (Claude) for ${pair}`);
    } catch (err2) {
      console.warn(`⚠️ OpenRouter Claude failed: ${err2.message} — trying OpenRouter (GPT-4o)`);
      provider = "openrouter_gpt4o";

      // Fallback 2: OpenRouter with GPT-4o
      try {
        rawText = await callOpenRouter(prompt, image4hPath, image15mPath, true);
        console.log(`✅ Analysis via OpenRouter (GPT-4o) for ${pair}`);
      } catch (err3) {
        throw new Error("All AI providers failed. Please try again in a few minutes.");
      }
    }
  }

  const analysis = parseAnalysisResponse(rawText);
  return { ...analysis, provider, analyzed_at: new Date().toISOString() };
}

module.exports = { analyzeChart };
