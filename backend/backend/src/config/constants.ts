export const CATEGORIES = [
  "Roads",
  "Waste Management",
  "Water",
  "Electricity",
  "Street Lighting",
  "Drainage",
  "Public Safety",
  "Public Transport",
  "Environment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const STATUSES = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
] as const;

export type Status = (typeof STATUSES)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SAFETY_RISKS = ["LOW", "MEDIUM", "HIGH"] as const;
export type SafetyRisk = (typeof SAFETY_RISKS)[number];

export const ROLES = ["CITIZEN", "AUTHORITY"] as const;
export type Role = (typeof ROLES)[number];

export const PRIORITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const CLUSTER_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export type ClusterStatus = (typeof CLUSTER_STATUSES)[number];
