import { CATEGORIES, SEVERITIES, SAFETY_RISKS, Category, Severity, SafetyRisk } from "../config/constants";
import {
  analyzeFallback,
  verifyFallback,
  AIAnalysisResult,
  VerificationResult,
} from "./fallbackAI.service";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

function safeParseJson(raw: string): any | null {
  try {
    // Strip markdown code fences if the model wrapped the JSON in them
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function isValidCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isValidSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
}

function isValidSafetyRisk(value: unknown): value is SafetyRisk {
  return typeof value === "string" && (SAFETY_RISKS as readonly string[]).includes(value);
}

/**
 * Validates and normalizes a raw AI analysis object against our schema.
 * Returns null if the object is too malformed to trust, in which case the
 * caller should fall back to the deterministic fallback AI.
 */
function validateAnalysis(raw: any, description: string): AIAnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;

  const category = isValidCategory(raw.category) ? raw.category : "Other";
  const severity = isValidSeverity(raw.severity) ? raw.severity : "MEDIUM";
  const safetyRisk = isValidSafetyRisk(raw.safetyRisk) ? raw.safetyRisk : "LOW";

  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim().slice(0, 120)
      : description.slice(0, 60);

  const urgencyScore = clampNumber(raw.urgencyScore, 0, 100, 50);
  const affectedPeopleEstimate = clampNumber(raw.affectedPeopleEstimate, 1, 1_000_000, 10);
  const confidence = clampNumber(raw.confidence, 0, 100, 60);

  const department =
    typeof raw.department === "string" && raw.department.trim()
      ? raw.department.trim()
      : "General Administration";

  const recommendedAction =
    typeof raw.recommendedAction === "string" && raw.recommendedAction.trim()
      ? raw.recommendedAction.trim()
      : "Route to relevant department for manual review";

  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords.filter((k: unknown) => typeof k === "string").slice(0, 10)
    : [];

  const reasoning = typeof raw.reasoning === "string" ? raw.reasoning : "";

  return {
    title,
    category,
    severity,
    urgencyScore,
    safetyRisk,
    affectedPeopleEstimate,
    department,
    recommendedAction,
    keywords,
    reasoning,
    confidence,
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function buildAnalysisPrompt(description: string, location?: string): string {
  return `You are an AI assistant for a civic issue reporting platform called CivicLens AI.
Analyze the following citizen-reported civic complaint and return ONLY a JSON object
(no markdown, no preamble, no explanation outside the JSON) with this exact shape:

{
  "title": string,
  "category": one of ${JSON.stringify(CATEGORIES)},
  "severity": one of ${JSON.stringify(SEVERITIES)},
  "urgencyScore": number (0-100),
  "safetyRisk": one of ${JSON.stringify(SAFETY_RISKS)},
  "affectedPeopleEstimate": number,
  "department": string,
  "recommendedAction": string,
  "keywords": string[],
  "reasoning": string,
  "confidence": number (0-100)
}

Complaint description: "${description}"
Location: "${location || "Not specified"}"

Return ONLY the JSON object.`;
}

function buildVerificationPrompt(notes: string, hasAfterImage: boolean): string {
  return `You are verifying whether a civic issue resolution is genuine for CivicLens AI.
Resolution notes provided by the authority: "${notes}"
An after-image was ${hasAfterImage ? "provided" : "NOT provided"}.

Return ONLY a JSON object with this exact shape:
{
  "verified": boolean,
  "confidence": number (0-100),
  "verificationReason": string
}`;
}

async function callGemini(prompt: string): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GEMINI_ENDPOINT(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[AI] Gemini API returned status ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return safeParseJson(text);
  } catch (error) {
    console.error("[AI] Gemini API call failed, will use fallback:", (error as Error).message);
    return null;
  }
}

/**
 * Analyzes a civic issue description (and optional location/image reference)
 * using Gemini when GEMINI_API_KEY is configured. Automatically and silently
 * falls back to the local keyword-based AI if Gemini is unavailable,
 * misconfigured, rate-limited, or returns an invalid response. The API key
 * itself is never included in any response sent to clients.
 */
export async function analyzeIssue(
  description: string,
  location?: string,
  _imagePath?: string | null
): Promise<AIAnalysisResult & { source: "gemini" | "fallback" }> {
  if (isGeminiConfigured()) {
    const prompt = buildAnalysisPrompt(description, location);
    const raw = await callGemini(prompt);
    const validated = raw ? validateAnalysis(raw, description) : null;

    if (validated) {
      return { ...validated, source: "gemini" };
    }

    console.warn("[AI] Gemini response invalid or unavailable, using fallback AI.");
  }

  const fallback = analyzeFallback(description, location);
  return { ...fallback, source: "fallback" };
}

/**
 * Verifies whether a submitted resolution appears genuine. Uses Gemini when
 * configured, otherwise a conservative local heuristic.
 */
export async function verifyResolution(
  notes: string,
  hasAfterImage: boolean
): Promise<VerificationResult & { source: "gemini" | "fallback" }> {
  if (isGeminiConfigured()) {
    const prompt = buildVerificationPrompt(notes, hasAfterImage);
    const raw = await callGemini(prompt);

    if (raw && typeof raw === "object") {
      const verified = Boolean(raw.verified);
      const confidence = clampNumber(raw.confidence, 0, 100, 50);
      const verificationReason =
        typeof raw.verificationReason === "string" && raw.verificationReason.trim()
          ? raw.verificationReason.trim()
          : "Verification completed by AI.";

      return { verified, confidence, verificationReason, source: "gemini" };
    }

    console.warn("[AI] Gemini verification unavailable, using fallback.");
  }

  const fallback = verifyFallback(notes, hasAfterImage);
  return { ...fallback, source: "fallback" };
}

export { isGeminiConfigured };
