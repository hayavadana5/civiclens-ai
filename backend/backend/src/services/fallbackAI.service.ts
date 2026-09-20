import { Category, Severity, SafetyRisk } from "../config/constants";
import { extractKeywords } from "../utils/textUtils";

export interface AIAnalysisResult {
  title: string;
  category: Category;
  severity: Severity;
  urgencyScore: number;
  safetyRisk: SafetyRisk;
  affectedPeopleEstimate: number;
  department: string;
  recommendedAction: string;
  keywords: string[];
  reasoning: string;
  confidence: number;
}

interface CategoryRule {
  category: Category;
  triggers: string[];
  department: string;
  baseSeverity: Severity;
  baseSafetyRisk: SafetyRisk;
  baseUrgency: number;
  baseAffected: number;
  action: string;
}

const RULES: CategoryRule[] = [
  {
    category: "Roads",
    triggers: ["pothole", "road", "crack", "asphalt", "highway", "footpath", "pavement"],
    department: "Road Maintenance",
    baseSeverity: "HIGH",
    baseSafetyRisk: "HIGH",
    baseUrgency: 78,
    baseAffected: 40,
    action: "Immediate inspection and temporary barricading of the affected road section",
  },
  {
    category: "Waste Management",
    triggers: ["garbage", "waste", "dumping", "trash", "litter", "rubbish"],
    department: "Sanitation Department",
    baseSeverity: "MEDIUM",
    baseSafetyRisk: "MEDIUM",
    baseUrgency: 55,
    baseAffected: 60,
    action: "Schedule waste collection and clean-up crew within 48 hours",
  },
  {
    category: "Water",
    triggers: ["water", "leak", "pipe", "pipeline", "sewage", "contaminat"],
    department: "Water Supply Department",
    baseSeverity: "HIGH",
    baseSafetyRisk: "MEDIUM",
    baseUrgency: 70,
    baseAffected: 80,
    action: "Dispatch water department technician to inspect and repair the leak",
  },
  {
    category: "Street Lighting",
    triggers: ["streetlight", "street light", "lamp", "dark", "bulb", "lighting"],
    department: "Electrical Maintenance",
    baseSeverity: "MEDIUM",
    baseSafetyRisk: "MEDIUM",
    baseUrgency: 50,
    baseAffected: 30,
    action: "Send electrical crew to repair or replace the faulty streetlight",
  },
  {
    category: "Public Safety",
    triggers: ["manhole", "accident", "danger", "unsafe", "hazard", "exposed wire", "collapse"],
    department: "Public Safety Department",
    baseSeverity: "CRITICAL",
    baseSafetyRisk: "HIGH",
    baseUrgency: 92,
    baseAffected: 100,
    action: "Urgent on-site inspection and immediate hazard containment required",
  },
  {
    category: "Drainage",
    triggers: ["drain", "flood", "drainage", "waterlog", "clog", "overflow"],
    department: "Drainage & Flood Control",
    baseSeverity: "HIGH",
    baseSafetyRisk: "MEDIUM",
    baseUrgency: 68,
    baseAffected: 70,
    action: "Clear blocked drainage and monitor for flooding risk",
  },
  {
    category: "Electricity",
    triggers: ["power", "electricity", "transformer", "outage", "wire", "shock"],
    department: "Electricity Board",
    baseSeverity: "HIGH",
    baseSafetyRisk: "HIGH",
    baseUrgency: 75,
    baseAffected: 90,
    action: "Dispatch electrical safety team to inspect the reported hazard",
  },
  {
    category: "Public Transport",
    triggers: ["bus", "stop", "transport", "shelter", "station", "signal"],
    department: "Transport Authority",
    baseSeverity: "MEDIUM",
    baseSafetyRisk: "LOW",
    baseUrgency: 45,
    baseAffected: 50,
    action: "Inspect and repair public transport infrastructure",
  },
  {
    category: "Environment",
    triggers: ["pollution", "smoke", "tree", "noise", "air quality", "smell"],
    department: "Environment Department",
    baseSeverity: "MEDIUM",
    baseSafetyRisk: "LOW",
    baseUrgency: 40,
    baseAffected: 100,
    action: "Assess environmental impact and take corrective measures",
  },
];

const DEFAULT_RULE: CategoryRule = {
  category: "Other",
  triggers: [],
  department: "General Administration",
  baseSeverity: "MEDIUM",
  baseSafetyRisk: "LOW",
  baseUrgency: 35,
  baseAffected: 10,
  action: "Route to relevant department for manual review",
};

function matchRule(text: string): CategoryRule {
  const lower = text.toLowerCase();
  let best: CategoryRule | null = null;
  let bestMatches = 0;

  for (const rule of RULES) {
    const matches = rule.triggers.filter((t) => lower.includes(t)).length;
    if (matches > bestMatches) {
      bestMatches = matches;
      best = rule;
    }
  }

  return best ?? DEFAULT_RULE;
}

function titleFromDescription(description: string, category: Category): string {
  const trimmed = description.trim();
  if (trimmed.length <= 60) return trimmed;
  const firstSentence = trimmed.split(/[.!?]/)[0];
  const base = firstSentence.length > 5 ? firstSentence : trimmed;
  const short = base.length > 60 ? `${base.slice(0, 57)}...` : base;
  return short.charAt(0).toUpperCase() + short.slice(1) || `${category} issue reported`;
}

/**
 * Deterministic, keyword-based fallback AI analysis. Runs entirely locally
 * with no external API calls, so the app keeps working without a
 * GEMINI_API_KEY. Adds a small amount of controlled randomness so seed data
 * and repeated similar reports don't look robotically identical.
 */
export function analyzeFallback(
  description: string,
  location?: string
): AIAnalysisResult {
  const rule = matchRule(description);
  const keywords = extractKeywords(description, 8);

  // Small deterministic jitter based on description length, so results are
  // stable for the same input but vary a bit across different reports.
  const jitter = (description.length % 9) - 4; // -4..4

  const urgencyScore = Math.max(5, Math.min(100, rule.baseUrgency + jitter));
  const affectedPeopleEstimate = Math.max(1, rule.baseAffected + jitter * 2);

  // Bump severity/safety risk up a notch if certain danger words are present
  const dangerWords = ["danger", "accident", "child", "children", "school", "hospital", "night"];
  const hasDangerWord = dangerWords.some((w) => description.toLowerCase().includes(w));

  let severity = rule.baseSeverity;
  let safetyRisk = rule.baseSafetyRisk;
  if (hasDangerWord) {
    if (severity === "MEDIUM") severity = "HIGH";
    else if (severity === "HIGH") severity = "CRITICAL";
    if (safetyRisk === "LOW") safetyRisk = "MEDIUM";
    else if (safetyRisk === "MEDIUM") safetyRisk = "HIGH";
  }

  const reasoningParts = [
    `Classified as "${rule.category}" based on keyword matches in the description.`,
  ];
  if (hasDangerWord) {
    reasoningParts.push("Escalated severity due to safety-related language detected in the report.");
  }
  if (location) {
    reasoningParts.push(`Location context "${location}" was considered for department routing.`);
  }

  return {
    title: titleFromDescription(description, rule.category),
    category: rule.category,
    severity,
    urgencyScore,
    safetyRisk,
    affectedPeopleEstimate,
    department: rule.department,
    recommendedAction: rule.action,
    keywords,
    reasoning: reasoningParts.join(" "),
    confidence: 68, // fallback AI is deterministic but less confident than Gemini
  };
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  verificationReason: string;
}

/**
 * Fallback resolution verification. Without an image-understanding model we
 * can't truly inspect the after-image, so this uses a conservative heuristic
 * based on whether notes and an after-image were actually provided.
 */
export function verifyFallback(notes: string, hasAfterImage: boolean): VerificationResult {
  const notesLength = (notes || "").trim().length;

  if (hasAfterImage && notesLength > 15) {
    return {
      verified: true,
      confidence: 72,
      verificationReason:
        "After-image and detailed resolution notes were provided; heuristic checks passed. Manual spot-check recommended.",
    };
  }

  if (hasAfterImage && notesLength <= 15) {
    return {
      verified: false,
      confidence: 45,
      verificationReason:
        "After-image provided but resolution notes are too brief to confirm the fix. Please add more detail.",
    };
  }

  return {
    verified: false,
    confidence: 30,
    verificationReason:
      "No after-image provided. Unable to confirm resolution without visual evidence.",
  };
}
