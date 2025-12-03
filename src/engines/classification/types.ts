/**
 * Classification Engine Types
 * 
 * Types for LLM output classification, intent detection,
 * instruction-following evaluation, and hallucination risk assessment.
 * 
 * WHAT THIS PROVIDES:
 * ✅ Intent classification tags
 * ✅ Instruction rule definitions
 * ✅ Hallucination risk signals
 * ✅ Reasoning compression metrics
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Guarantee 100% accuracy (heuristic-based)
 * ❌ Replace human review
 * ❌ Detect all hallucinations (provides risk indicators)
 * 
 * @module engines/classification/types
 * @author Haiec
 * @license MIT
 */

/**
 * Intent tags for classifying LLM output purpose.
 */
export type IntentTag =
  | 'summary'
  | 'explanation'
  | 'code'
  | 'list'
  | 'question'
  | 'instruction'
  | 'creative'
  | 'analysis'
  | 'comparison'
  | 'definition'
  | 'translation'
  | 'conversation'
  | 'data'
  | 'unknown';

/**
 * Intent candidate with confidence score.
 */
export interface IntentCandidate {
  tag: IntentTag;
  confidence: number;
  signals: string[];
}

/**
 * Rule types for instruction-following evaluation.
 */
export type InstructionRuleType =
  | 'format'    // Expected output format (json, list, paragraph)
  | 'length'    // Word/bullet count constraints
  | 'include'   // Required terms
  | 'exclude'   // Forbidden terms
  | 'schema'    // JSON schema requirements
  | 'coverage'; // Required entities/topics

/**
 * Format expectation for format rules.
 */
export type FormatExpectation = 'json' | 'list' | 'paragraph' | 'code';

/**
 * Instruction rule definition.
 */
export interface InstructionRule {
  id: string;
  type: InstructionRuleType;
  params: {
    // format rule
    expect?: FormatExpectation;
    // length rule
    minWords?: number;
    maxWords?: number;
    minBullets?: number;
    maxBullets?: number;
    // include/exclude rules
    terms?: string[];
    // schema rule
    requiredKeys?: string[];
    // coverage rule
    entities?: string[];
  };
}

/**
 * Result of evaluating a single instruction rule.
 */
export interface RuleResult {
  id: string;
  passed: boolean;
  reason?: string;
}

/**
 * Hallucination risk signals.
 */
export interface HallucinationSignals {
  /** Score for speculative/new entities not in prompt (0-1) */
  speculativeFactsScore: number;
  /** Score for fabricated JSON keys not in prompt (0-1) */
  fabricatedKeysScore: number;
  /** Score for overconfident language (0-1) */
  overconfidentScore: number;
  /** Score for internal contradictions (0-1) */
  contradictionScore: number;
  /** Number of custom hooks applied */
  customHooksCount: number;
}

/**
 * Hallucination risk label.
 */
export type HallucinationLabel = 'low' | 'medium' | 'high';

/**
 * Reasoning compression metrics.
 */
export interface CompressionMetrics {
  /** Prompt complexity level (1-3) */
  complexityLevel: 1 | 2 | 3;
  /** Expected minimum words for complexity */
  expectedWords: number;
  /** Deficit from expected length (0-1) */
  lengthDeficit: number;
  /** Drop in entropy from baseline (0-1) */
  entropyDrop: number;
  /** Missing transition words (0 or 1) */
  missingTransitions: number;
  /** Word repetition score (0-1) */
  repetitionScore: number;
}

/**
 * Reasoning compression label.
 */
export type ReasoningLabel = 'low' | 'moderate' | 'high';

/**
 * JSON repair step record.
 */
export interface JsonRepairStep {
  step: string;
  applied: boolean;
}

/**
 * Base metrics extracted from text.
 */
export interface BaseMetrics {
  words: number;
  sentences: number;
  bullets: number;
  entropy: number;
}

/**
 * Classification policy configuration.
 */
export interface ClassificationPolicy {
  /** Instruction rules to evaluate */
  instructionRules?: InstructionRule[];
  /** Hallucination detection config */
  hallucination?: {
    /** Enable internal signal detection (default: true) */
    internalSignals?: boolean;
    /** Custom hallucination detection hooks */
    customHooks?: Array<(prompt: string, output: string) => number>;
    /** 
     * Weight overrides for hallucination signals (0-1 each).
     * Lower weights = less sensitive detection.
     * Default: { speculative: 0.4, fabricated: 0.3, overconfident: 0.2, contradiction: 0.1 }
     */
    weights?: {
      speculative?: number;
      fabricated?: number;
      overconfident?: number;
      contradiction?: number;
    };
  };
  /** Compression detection config */
  compression?: {
    /** Enable compression detection (default: true) */
    enabled?: boolean;
    /** Baseline entropy for comparison */
    baselineEntropy?: number;
    /**
     * Minimum expected words per complexity level.
     * Default: { level1: 30, level2: 100, level3: 200 }
     */
    expectedWords?: {
      level1?: number;
      level2?: number;
      level3?: number;
    };
  };
  /** Intent detection config */
  intent?: {
    /** Enable intent detection (default: true) */
    enabled?: boolean;
  };
  /** JSON normalization config */
  json?: {
    /** Enable JSON detection and repair (default: true) */
    enabled?: boolean;
    /** Maximum repair steps to attempt (default: 6) */
    maxRepairSteps?: number;
  };
  /** Performance config */
  performance?: {
    /** Maximum output length to scan (default: 100000). Longer outputs are truncated. */
    maxOutputLength?: number;
  };
}

/**
 * Complete classification result.
 */
export interface ClassificationResult {
  /** Primary detected intent */
  intent: IntentTag | null;
  /** All intent candidates with confidence */
  intentCandidates: IntentCandidate[];
  /** Whether output has structure (list or JSON) */
  isStructured: boolean;
  /** Whether output contains valid JSON */
  isJson: boolean;
  /** Parsed/repaired JSON if available */
  normalizedJson?: unknown;
  /** Whether instructions were followed (>=80% compliance) */
  instructionFollowed: boolean;
  /** Instruction compliance ratio (0-1) */
  instructionCompliance: number;
  /** Hallucination risk score (0-1) */
  hallucinationRisk: number;
  /** Hallucination risk label */
  hallucinationLabel: HallucinationLabel;
  /** Reasoning compression score (0-1) */
  reasoningCompression: number;
  /** Reasoning compression label */
  reasoningLabel: ReasoningLabel;
  /** Generated classification tags */
  tags: string[];
  /** Detailed metrics and signals */
  details: {
    baseMetrics: BaseMetrics;
    intent: {
      candidates: IntentCandidate[];
    };
    json: {
      candidate: string | null;
      repairSteps: JsonRepairStep[];
      repairSucceeded: boolean;
    };
    instructions: {
      rules: InstructionRule[];
      ruleResults: RuleResult[];
      complianceRatio: number;
    };
    hallucination: HallucinationSignals;
    compression: CompressionMetrics;
  };
  /** Limitations of this analysis */
  limitations: string[];
  /** Methodology description */
  methodology: string;
}
