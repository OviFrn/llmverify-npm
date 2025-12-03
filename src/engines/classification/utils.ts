/**
 * Classification Engine Utilities
 * 
 * Shared helper functions for classification.
 * 
 * @module engines/classification/utils
 * @author Haiec
 * @license MIT
 */

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes Shannon entropy of text.
 */
export function computeEntropy(text: string): number {
  if (!text || text.length === 0) return 0;
  
  const freq: Record<string, number> = {};
  for (const ch of text) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  
  const len = text.length;
  let entropy = 0;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Tokenizes text into words.
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Counts sentences in text.
 */
export function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Counts bullet points/list items in text.
 */
export function countBullets(text: string): number {
  const patterns = [
    /^[-*•]\s+/gm,           // Bullet points
    /^\d+[.)]\s+/gm,         // Numbered lists
    /^[a-z][.)]\s+/gim       // Lettered lists
  ];
  
  let count = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  
  return count;
}

/**
 * Common English stopwords.
 */
export const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then'
]);

/**
 * Extracts capitalized tokens (potential entities).
 */
export function extractCapitalizedTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z]/g, '');
    if (word.length > 1 && /^[A-Z]/.test(word)) {
      // Skip if at sentence start (after . ! ?)
      if (i > 0) {
        const prev = words[i - 1];
        if (!/[.!?]$/.test(prev)) {
          const lower = word.toLowerCase();
          if (!STOPWORDS.has(lower)) {
            tokens.add(word);
          }
        }
      }
    }
  }
  
  return tokens;
}

/**
 * Computes word frequency excluding stopwords.
 */
export function computeWordFrequency(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = tokenize(text.toLowerCase());
  
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 2 && !STOPWORDS.has(clean)) {
      freq.set(clean, (freq.get(clean) || 0) + 1);
    }
  }
  
  return freq;
}

/**
 * Gets the most frequent word count.
 */
export function getMaxWordFrequency(text: string): number {
  const freq = computeWordFrequency(text);
  let max = 0;
  for (const count of freq.values()) {
    if (count > max) max = count;
  }
  return max;
}

/**
 * Checks if text contains any of the patterns (case-insensitive).
 */
export function containsAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some(p => lower.includes(p.toLowerCase()));
}

/**
 * Counts how many patterns are found in text.
 */
export function countMatches(text: string, patterns: string[]): number {
  const lower = text.toLowerCase();
  return patterns.filter(p => lower.includes(p.toLowerCase())).length;
}
