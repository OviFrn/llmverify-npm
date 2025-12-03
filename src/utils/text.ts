/**
 * Text Processing Utilities
 * 
 * @module utils/text
 * @author Haiec
 * @license MIT
 */

/**
 * Split text into sentences
 */
export function splitSentences(text: string): string[] {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

/**
 * Split text into paragraphs
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

/**
 * Extract surrounding context
 */
export function extractContext(
  text: string, 
  index: number, 
  windowSize: number
): string {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(text.length, index + windowSize);
  
  let context = text.substring(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if text contains code blocks
 */
export function containsCodeBlocks(text: string): boolean {
  return /```[\s\S]*?```|`[^`]+`/.test(text);
}

/**
 * Remove code blocks from text
 */
export function removeCodeBlocks(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

/**
 * Check if text is likely quoted/example content
 */
export function isLikelyQuoted(text: string, match: string): boolean {
  const matchIndex = text.indexOf(match);
  if (matchIndex === -1) return false;
  
  const before = text.substring(Math.max(0, matchIndex - 20), matchIndex);
  const after = text.substring(
    matchIndex + match.length, 
    matchIndex + match.length + 20
  );
  
  const quoteChars = ['"', "'", '`', '\u201C', '\u201D', '\u2018', '\u2019'];
  
  return quoteChars.some(q => before.includes(q) || after.includes(q));
}
