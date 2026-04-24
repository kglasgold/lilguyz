const MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

export function isLLMConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callLLM(systemPrompt, userMessage) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("LLM request failed:", response.status, err);
    return null;
  }

  const data = await response.json();
  return data.content?.[0]?.text || null;
}

export async function callLLMJson(systemPrompt, userMessage) {
  const text = await callLLM(systemPrompt, userMessage);
  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Failed to parse LLM JSON:", err.message, text);
    return null;
  }
}
