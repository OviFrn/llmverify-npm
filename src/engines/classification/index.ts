/**
 * Classification Engine
 * 
 * Comprehensive LLM output classification including intent detection,
 * JSON repair, instruction-following evaluation, hallucination risk,
 * and reasoning compression analysis.
 * 
 * WHAT THIS DOES:
 * ✅ Detects output intent (summary, code, list, etc.)
 * ✅ Detects and repairs malformed JSON
 * ✅ Evaluates instruction-following compliance
 * ✅ Calculates hallucination risk indicators
 * ✅ Detects reasoning compression
 * ✅ Generates classification tags
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Guarantee hallucination detection (heuristic-based)
 * ❌ Verify factual accuracy (no ground truth)
 * ❌ Replace human review
 * 
 * @module engines/classification
 * @author Haiec
 * @license MIT
 */

// Types
export type {
  IntentTag,
  IntentCandidate,
  InstructionRuleType,
  FormatExpectation,
  InstructionRule,
  RuleResult,
  HallucinationSignals,
  HallucinationLabel,
  CompressionMetrics,
  ReasoningLabel,
  JsonRepairStep,
  BaseMetrics,
  ClassificationPolicy,
  ClassificationResult
} from './types';

// Sub-modules
export { detectIntent, getPrimaryIntent } from './intent';
export { detectAndRepairJson } from './json-repair';
export { evaluateInstructionRules } from './instruction-eval';
export { 
  calculateHallucinationSignals, 
  calculateHallucinationRisk, 
  getHallucinationLabel 
} from './hallucination';
export { 
  calculateCompressionMetrics, 
  calculateCompressionScore, 
  getReasoningLabel 
} from './compression';

// Main engine
export { ClassificationEngine, classify } from './engine';
