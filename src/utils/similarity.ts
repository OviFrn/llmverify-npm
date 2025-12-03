/**
 * Text Similarity Utilities
 * 
 * Simple similarity measures for consistency checking.
 * 
 * @module utils/similarity
 * @author Haiec
 * @license MIT
 */

/**
 * Calculate Jaccard similarity between two texts
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 1;
  
  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity using word frequency vectors
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const freq1 = getWordFrequency(text1);
  const freq2 = getWordFrequency(text2);
  
  const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const word of allWords) {
    const v1 = freq1[word] || 0;
    const v2 = freq2[word] || 0;
    
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Get word frequency map
 */
function getWordFrequency(text: string): Record<string, number> {
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};
  
  for (const word of words) {
    if (word.length > 0) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  
  return freq;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate normalized Levenshtein similarity (0-1)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Combined similarity score using multiple methods
 */
export function combinedSimilarity(text1: string, text2: string): number {
  const jaccard = jaccardSimilarity(text1, text2);
  const cosine = cosineSimilarity(text1, text2);
  
  // Weighted average
  return jaccard * 0.4 + cosine * 0.6;
}
