import Issue, { IIssue } from "../models/Issue";
import IssueCluster from "../models/IssueCluster";
import { jaccardSimilarity, distanceInKm } from "../utils/textUtils";
import { Types } from "mongoose";

const SIMILARITY_THRESHOLD = 0.45; // 0-1, combined weighted score
const NEARBY_RADIUS_KM = 1.5;

export interface SimilarIssueMatch {
  issue: IIssue;
  score: number;
}

/**
 * Computes a combined similarity score (0-1) between a candidate issue and
 * an existing issue, weighing category match, keyword overlap, location
 * proximity, and description text overlap. Simple, explainable heuristic —
 * no vector database or embeddings involved.
 */
function computeSimilarityScore(
  candidate: {
    category: string;
    keywords: string[];
    description: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  existing: IIssue
): number {
  let score = 0;

  // Category match is a strong signal (weight 0.35)
  if (candidate.category === existing.category) {
    score += 0.35;
  }

  // Keyword overlap (weight 0.35)
  const keywordSim = jaccardSimilarity(candidate.keywords, existing.keywords || []);
  score += keywordSim * 0.35;

  // Description text overlap as a lightweight backup signal (weight 0.15)
  const candidateWords = candidate.description.toLowerCase().split(/\s+/);
  const existingWords = (existing.description || "").toLowerCase().split(/\s+/);
  const textSim = jaccardSimilarity(candidateWords, existingWords);
  score += textSim * 0.15;

  // Location proximity (weight 0.15)
  const dist = distanceInKm(
    candidate.latitude,
    candidate.longitude,
    existing.latitude,
    existing.longitude
  );
  if (dist !== null) {
    if (dist <= NEARBY_RADIUS_KM) {
      score += (1 - dist / NEARBY_RADIUS_KM) * 0.15;
    }
  }

  return Math.min(1, score);
}

/**
 * Searches existing issues (excluding the given issue itself) for ones that
 * appear similar/duplicate to the candidate, based on category, keywords,
 * description text, and location proximity.
 */
export async function findSimilarIssues(
  candidate: {
    category: string;
    keywords: string[];
    description: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  excludeId?: Types.ObjectId | string
): Promise<SimilarIssueMatch[]> {
  const query: any = { category: candidate.category };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // Narrow the search space to the same category first (practical, no heavy infra)
  const candidatesPool = await Issue.find(query).limit(200);

  const matches: SimilarIssueMatch[] = [];
  for (const existing of candidatesPool) {
    const score = computeSimilarityScore(candidate, existing);
    if (score >= SIMILARITY_THRESHOLD) {
      matches.push({ issue: existing, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/**
 * Associates an issue with an IssueCluster. If one of the similar issues
 * already belongs to a cluster, the new issue joins that cluster. Otherwise
 * a new cluster is created containing both the new issue and its best match.
 */
export async function associateWithCluster(
  issue: IIssue,
  similarMatches: SimilarIssueMatch[]
): Promise<Types.ObjectId | null> {
  if (similarMatches.length === 0) return null;

  const existingClusterMatch = similarMatches.find((m) => m.issue.clusterId);

  if (existingClusterMatch && existingClusterMatch.issue.clusterId) {
    const cluster = await IssueCluster.findById(existingClusterMatch.issue.clusterId);
    if (cluster) {
      if (!cluster.reportIds.some((id) => id.equals(issue._id))) {
        cluster.reportIds.push(issue._id);
      }
      cluster.reportCount = cluster.reportIds.length;
      cluster.priorityScore = Math.max(cluster.priorityScore, issue.priorityScore);
      await cluster.save();
      return cluster._id;
    }
  }

  // No existing cluster among matches — create a new one from the top match
  const bestMatch = similarMatches[0].issue;
  const newCluster = await IssueCluster.create({
    title: `${issue.category} issues near ${issue.location || "reported area"}`,
    category: issue.category,
    location: issue.location || bestMatch.location || "",
    reportIds: [bestMatch._id, issue._id],
    reportCount: 2,
    priorityScore: Math.max(issue.priorityScore, bestMatch.priorityScore),
    status: "OPEN",
  });

  // Backfill the cluster reference onto the existing matched issue too
  bestMatch.clusterId = newCluster._id;
  await bestMatch.save();

  return newCluster._id;
}
