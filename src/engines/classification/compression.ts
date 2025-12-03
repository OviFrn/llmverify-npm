/**
 * Reasoning Compression Score Module
 * 
 * Detects if LLM output has compressed/shallow reasoning
 * relative to prompt complexity.
 * 
 * @module engines/classification/compression
 * @author Haiec
 * @license MIT
 */

import { CompressionMetrics, ReasoningLabel } from './types';
import { clamp, tokenize, computeEntropy, getMaxWordFrequency, containsAny } from './utils';

/**
 * Reasoning verbs that indicate complex prompts.
 */
const REASONING_VERBS = /explain|analyz[ei]|compare|argue|justify|walk.*through|step-?by-?step/i;

/**
 * Multi-part prompt patterns.
 */
const MULTI_PART_PATTERNS = /compare .* and .*|then .* afterwards|first .* then/i;

/**
 * Transition words expected in reasoning.
 */
const TRANSITION_WORDS = [
  'because',
  'therefore',
  'so that',
  'as a result',
  'then',
  'next',
  'consequently',
  'thus',
  'hence',
  'since',
  'due to',
  'in order to'
];

/**
 * Determines prompt complexity level (1-3).
 */
function determineComplexityLevel(prompt: string): 1 | 2 | 3 {
  const words = tokenize(prompt).length;
  const hasReasoningVerb = REASONING_VERBS.test(prompt);
  const hasMultiPart = MULTI_PART_PATTERNS.test(prompt);
  
  if (words < 150 && !hasReasoningVerb && !hasMultiPart) {
    return 1;
  }
  
  if ((words >= 150 && words <= 400) || hasReasoningVerb) {
    return 2;
  }
  
  return 3;
}

/** Default expected words per complexity level (relaxed for Level 1) */
export const DEFAULT_EXPECTED_WORDS = {
  level1: 30,  // Reduced from 50 - simple Q&A can be very short
  level2: 100, // Reduced from 150 - moderate complexity
  level3: 200  // Reduced from 250 - complex prompts
};

/**
 * Gets expected minimum words for complexity level.
 * 
 * @param level - Complexity level (1-3)
 * @param overrides - Optional word count overrides
 */
export function getExpectedWords(
  level: 1 | 2 | 3,
  overrides?: { level1?: number; level2?: number; level3?: number }
): number {
  switch (level) {
    case 1: return overrides?.level1 ?? DEFAULT_EXPECTED_WORDS.level1;
    case 2: return overrides?.level2 ?? DEFAULT_EXPECTED_WORDS.level2;
    case 3: return overrides?.level3 ?? DEFAULT_EXPECTED_WORDS.level3;
  }
}

/**
 * Calculates length deficit score.
 */
function calculateLengthDeficit(actualWords: number, expectedWords: number): number {
  if (actualWords >= expectedWords) return 0;
  return (expectedWords - actualWords) / expectedWords;
}

/**
 * Calculates entropy drop from baseline.
 */
function calculateEntropyDrop(currentEntropy: number, baselineEntropy?: number): number {
  if (!baselineEntropy || baselineEntropy <= 0) return 0;
  if (currentEntropy >= baselineEntropy) return 0;
  return (baselineEntropy - currentEntropy) / baselineEntropy;
}

/**
 * Checks for missing transition words.
 */
function checkMissingTransitions(text: string, complexityLevel: 1 | 2 | 3): number {
  if (complexityLevel < 2) return 0;
  
  const hasTransitions = containsAny(text, TRANSITION_WORDS);
  return hasTransitions ? 0 : 1;
}

/**
 * Calculates repetition score.
 */
function calculateRepetitionScore(text: string): number {
  const words = tokenize(text).length;
  if (words === 0) return 0;
  
  const maxFreq = getMaxWordFrequency(text);
  const repetitionRatio = maxFreq / words;
  
  // Score: 0 if ratio < 0.1, 1 if ratio >= 0.3
  return clamp(repetitionRatio / 0.3, 0, 1);
}

/**
 * Calculates reasoning compression metrics.
 * 
 * @param prompt - The original prompt
 * @param output - The LLM output
 * @param baselineEntropy - Optional baseline entropy for comparison
 * @param expectedWordsOverrides - Optional word count overrides per level
 * @returns Compression metrics
 */
export function calculateCompressionMetrics(
  prompt: string,
  output: string,
  baselineEntropy?: number,
  expectedWordsOverrides?: { level1?: number; level2?: number; level3?: number }
): CompressionMetrics {
  const complexityLevel = determineComplexityLevel(prompt);
  const expectedWords = getExpectedWords(complexityLevel, expectedWordsOverrides);
  const actualWords = tokenize(output).length;
  const currentEntropy = computeEntropy(output);
  
  const lengthDeficit = calculateLengthDeficit(actualWords, expectedWords);
  const entropyDrop = calculateEntropyDrop(currentEntropy, baselineEntropy);
  const missingTransitions = checkMissingTransitions(output, complexityLevel);
  const repetitionScore = calculateRepetitionScore(output);
  
  return {
    complexityLevel,
    expectedWords,
    lengthDeficit,
    entropyDrop,
    missingTransitions,
    repetitionScore
  };
}

/**
 * Calculates overall reasoning compression score.
 * 
 * @param metrics - Compression metrics
 * @returns Compression score (0-1)
 */
export function calculateCompressionScore(metrics: CompressionMetrics): number {
  const score = 
    0.4 * metrics.lengthDeficit +
    0.3 * metrics.entropyDrop +
    0.2 * metrics.missingTransitions +
    0.1 * metrics.repetitionScore;
  
  return clamp(score, 0, 1);
}

/**
 * Gets reasoning compression label from score.
 */
export function getReasoningLabel(score: number): ReasoningLabel {
  if (score <= 0.3) return 'low';
  if (score <= 0.6) return 'moderate';
  return 'high';
}
