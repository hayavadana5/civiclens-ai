const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "so", "to", "of", "in", "on", "at",
  "for", "with", "by", "from", "up", "down", "into", "near", "over",
  "under", "again", "further", "there", "here", "this", "that", "these",
  "those", "it", "its", "as", "not", "no", "very", "also", "has", "have",
  "had", "we", "i", "you", "they", "he", "she", "them", "our", "my",
  "please", "there's", "please.", "since", "due", "because",
]);

/**
 * Extracts simple, meaningful keywords from free text by lowercasing,
 * stripping punctuation, removing stop words and short tokens, and
 * de-duplicating. This is intentionally lightweight (no NLP libraries).
 */
export function extractKeywords(text: string, limit = 10): string[] {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const unique = Array.from(new Set(words));
  return unique.slice(0, limit);
}

/**
 * Simple Jaccard similarity between two keyword sets (0-1).
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Rough distance in kilometers between two lat/lng points (Haversine formula).
 */
export function distanceInKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
