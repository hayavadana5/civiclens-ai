import { Severity, SafetyRisk } from "../config/constants";

export interface PriorityInput {
  severity: Severity;
  urgencyScore: number; // 0-100
  safetyRisk: SafetyRisk;
  affectedPeopleEstimate: number;
  similarReportsCount?: number; // number of similar/duplicate reports found
  createdAt?: Date; // used to factor in age of the issue
}

export interface PriorityResult {
  priorityScore: number; // 0-100
  priorityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  LOW: 15,
  MEDIUM: 45,
  HIGH: 75,
  CRITICAL: 100,
};

const SAFETY_WEIGHTS: Record<SafetyRisk, number> = {
  LOW: 10,
  MEDIUM: 55,
  HIGH: 100,
};

/**
 * Calculates a 0-100 priority score for a civic issue based on multiple
 * weighted factors: severity, urgency, safety risk, number of people
 * affected, how many similar reports exist (clustering signal), and the
 * age of the issue (older unresolved issues get a small urgency bump).
 */
export function calculatePriority(input: PriorityInput): PriorityResult {
  const {
    severity,
    urgencyScore,
    safetyRisk,
    affectedPeopleEstimate,
    similarReportsCount = 0,
    createdAt,
  } = input;

  const severityScore = SEVERITY_WEIGHTS[severity] ?? SEVERITY_WEIGHTS.MEDIUM;
  const safetyScore = SAFETY_WEIGHTS[safetyRisk] ?? SAFETY_WEIGHTS.LOW;
  const clampedUrgency = Math.max(0, Math.min(100, urgencyScore || 0));

  // Affected people: logarithmic-ish scaling so it doesn't dominate the score
  const affectedScore = Math.min(100, Math.log2((affectedPeopleEstimate || 1) + 1) * 14);

  // Similar reports (clustering): more duplicate reports = higher confirmed impact
  const similarScore = Math.min(100, similarReportsCount * 12);

  // Age factor: issues open longer than a few days get a small boost so they
  // don't get buried, capped at 15 points.
  let ageScore = 0;
  if (createdAt) {
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    ageScore = Math.min(15, Math.max(0, ageDays - 1) * 2);
  }

  // Weighted combination of factors
  const rawScore =
    severityScore * 0.32 +
    clampedUrgency * 0.24 +
    safetyScore * 0.22 +
    affectedScore * 0.12 +
    similarScore * 0.07 +
    ageScore * 0.03;

  const priorityScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  let priorityLevel: PriorityResult["priorityLevel"];
  if (priorityScore >= 90) priorityLevel = "CRITICAL";
  else if (priorityScore >= 70) priorityLevel = "HIGH";
  else if (priorityScore >= 40) priorityLevel = "MEDIUM";
  else priorityLevel = "LOW";

  return { priorityScore, priorityLevel };
}
