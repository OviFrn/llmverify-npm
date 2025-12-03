/**
 * Hallucination Risk Heuristic Module
 * 
 * Detects potential hallucination signals in LLM output.
 * Uses heuristics - not definitive hallucination detection.
 * 
 * LIMITATIONS:
 * - Heuristic-based, not ground-truth verification
 * - May produce false positives/negatives
 * - Cannot detect factually incorrect but plausible statements
 * - Requires prompt context for best results
 * 
 * @module engines/classification/hallucination
 * @author Haiec
 * @license MIT
 */

import { HallucinationSignals, HallucinationLabel } from './types';
import { clamp, extractCapitalizedTokens, containsAny, countMatches } from './utils';

/**
 * Overconfident language patterns.
 */
const OVERCONFIDENT_PATTERNS = [
  'definitely',
  'certainly',
  'guaranteed',
  'proven',
  'no doubt',
  'undeniable',
  'absolutely',
  'without question',
  '100%',
  'always',
  'never fails'
];

/**
 * Contradiction patterns (simplified).
 */
const CONTRADICTION_PATTERNS = [
  { positive: /is required/i, negative: /is optional/i },
  { positive: /must/i, negative: /does not need to/i },
  { positive: /always/i, negative: /never/i },
  { positive: /can/i, negative: /cannot/i },
  { positive: /will/i, negative: /will not/i }
];

/**
 * Calculates speculative facts score.
 * Looks for capitalized entities in output not present in prompt.
 */
function calculateSpeculativeFactsScore(prompt: string, output: string): number {
  const promptEntities = extractCapitalizedTokens(prompt);
  const outputEntities = extractCapitalizedTokens(output);
  
  let newEntities = 0;
  for (const entity of outputEntities) {
    if (!promptEntities.has(entity)) {
      newEntities++;
    }
  }
  
  // Score: 0 if no new entities, 1 if 5+ new entities
  return clamp(newEntities / 5, 0, 1);
}

/**
 * Calculates overconfident language score.
 */
function calculateOverconfidentScore(text: string): number {
  const matches = countMatches(text, OVERCONFIDENT_PATTERNS);
  
  if (matches === 0) return 0;
  if (matches === 1) return 0.5;
  return 0.8;
}

/**
 * Calculates fabricated JSON keys score.
 * Looks for JSON keys not mentioned in prompt.
 */
function calculateFabricatedKeysScore(
  prompt: string,
  normalizedJson: unknown
): number {
  if (!normalizedJson || typeof normalizedJson !== 'object' || Array.isArray(normalizedJson)) {
    return 0;
  }
  
  const obj = normalizedJson as Record<string, unknown>;
  const keys = Object.keys(obj);
  const promptLower = prompt.toLowerCase();
  
  let extraKeys = 0;
  for (const key of keys) {
    if (!promptLower.includes(key.toLowerCase())) {
      extraKeys++;
    }
  }
  
  return clamp(extraKeys / 5, 0, 1);
}

/**
 * Calculates contradiction score.
 * Looks for simple contradictory patterns.
 */
function calculateContradictionScore(text: string): number {
  for (const pattern of CONTRADICTION_PATTERNS) {
    const hasPositive = pattern.positive.test(text);
    const hasNegative = pattern.negative.test(text);
    
    if (hasPositive && hasNegative) {
      // Found potential contradiction
      return 0.7;
    }
  }
  
  return 0;
}

/**
 * Calculates hallucination risk signals.
 * 
 * @param prompt - The original prompt
 * @param output - The LLM output
 * @param normalizedJson - Parsed JSON if available
 * @param customHooks - Optional custom detection hooks
 * @returns Hallucination signals and scores
 */
export function calculateHallucinationSignals(
  prompt: string,
  output: string,
  normalizedJson: unknown | undefined,
  customHooks?: Array<(prompt: string, output: string) => number>
): HallucinationSignals {
  const speculativeFactsScore = calculateSpeculativeFactsScore(prompt, output);
  const overconfidentScore = calculateOverconfidentScore(output);
  const fabricatedKeysScore = normalizedJson 
    ? calculateFabricatedKeysScore(prompt, normalizedJson) 
    : 0;
  const contradictionScore = calculateContradictionScore(output);
  
  return {
    speculativeFactsScore,
    fabricatedKeysScore,
    overconfidentScore,
    contradictionScore,
    customHooksCount: customHooks?.length ?? 0
  };
}

/** Default weights for hallucination signals (tuned to reduce false positives) */
export const DEFAULT_HALLUCINATION_WEIGHTS = {
  speculative: 0.35,   // Reduced from 0.4 - new entities are often legitimate
  fabricated: 0.25,    // Reduced from 0.3 - JSON keys often aren't in prompt
  overconfident: 0.25, // Increased from 0.2 - overconfident language is a stronger signal
  contradiction: 0.15  // Increased from 0.1 - contradictions are meaningful
};

/**
 * Calculates overall hallucination risk score.
 * 
 * @param signals - Hallucination signals
 * @param prompt - Original prompt
 * @param output - LLM output
 * @param customHooks - Optional custom hooks
 * @param weights - Optional weight overrides
 * @returns Risk score (0-1)
 */
export function calculateHallucinationRisk(
  signals: HallucinationSignals,
  prompt: string,
  output: string,
  customHooks?: Array<(prompt: string, output: string) => number>,
  weights?: {
    speculative?: number;
    fabricated?: number;
    overconfident?: number;
    contradiction?: number;
  }
): number {
  // Merge weights with defaults
  const w = {
    speculative: weights?.speculative ?? DEFAULT_HALLUCINATION_WEIGHTS.speculative,
    fabricated: weights?.fabricated ?? DEFAULT_HALLUCINATION_WEIGHTS.fabricated,
    overconfident: weights?.overconfident ?? DEFAULT_HALLUCINATION_WEIGHTS.overconfident,
    contradiction: weights?.contradiction ?? DEFAULT_HALLUCINATION_WEIGHTS.contradiction
  };
  
  // Base risk from internal signals
  let risk = 
    w.speculative * signals.speculativeFactsScore +
    w.fabricated * signals.fabricatedKeysScore +
    w.overconfident * signals.overconfidentScore +
    w.contradiction * signals.contradictionScore;
  
  // Apply custom hooks
  if (customHooks) {
    for (const hook of customHooks) {
      try {
        const hookScore = clamp(hook(prompt, output), 0, 1);
        risk += 0.2 * hookScore;
      } catch {
        // Ignore hook errors
      }
    }
  }
  
  return clamp(risk, 0, 1);
}

/**
 * Gets hallucination risk label from score.
 */
export function getHallucinationLabel(risk: number): HallucinationLabel {
  if (risk <= 0.3) return 'low';
  if (risk <= 0.6) return 'medium';
  return 'high';
}
