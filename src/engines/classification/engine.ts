/**
 * Classification Engine Implementation
 * 
 * Main engine that orchestrates all classification modules.
 * 
 * @module engines/classification/engine
 * @author Haiec
 * @license MIT
 */

import {
  ClassificationResult,
  ClassificationPolicy,
  BaseMetrics,
  IntentTag,
  CompressionMetrics
} from './types';
import { tokenize, countBullets, computeEntropy } from './utils';
import { detectIntent, getPrimaryIntent } from './intent';
import { detectAndRepairJson } from './json-repair';
import { evaluateInstructionRules } from './instruction-eval';
import {
  calculateHallucinationSignals,
  calculateHallucinationRisk,
  getHallucinationLabel
} from './hallucination';
import {
  calculateCompressionMetrics,
  calculateCompressionScore,
  getReasoningLabel
} from './compression';

const LIMITATIONS = [
  'Heuristic-based classification - not 100% accurate',
  'Hallucination detection is risk-based, not definitive',
  'Cannot verify factual accuracy without ground truth',
  'Intent detection may misclassify edge cases',
  'JSON repair may not fix all malformed JSON',
  'English language optimized',
  'Compression scores are most meaningful for complex prompts, not simple Q&A'
];

/** Default maximum output length to scan (100KB) */
const DEFAULT_MAX_OUTPUT_LENGTH = 100000;

const METHODOLOGY = 
  'Multi-signal classification using pattern matching for intent, ' +
  'heuristic analysis for hallucination risk, and structural analysis ' +
  'for instruction compliance. All scores are normalized 0-1 with ' +
  'confidence-based labeling.';

/**
 * Generates classification tags from results.
 */
function generateTags(
  intent: IntentTag | null,
  isJson: boolean,
  instructionFollowed: boolean,
  hallucinationLabel: string,
  reasoningCompression: number,
  bullets: number
): string[] {
  const tags: string[] = [];
  
  // Intent tag
  if (intent) {
    tags.push(`intent:${intent}`);
  }
  
  // JSON tag
  if (isJson) {
    tags.push('output:json');
  }
  
  // Instruction tag
  tags.push(instructionFollowed ? 'instruction:followed' : 'instruction:violated');
  
  // Hallucination tag
  tags.push(`hallucination:${hallucinationLabel}`);
  
  // Reasoning tag
  if (reasoningCompression > 0.6) {
    tags.push('reasoning:compressed');
  } else if (reasoningCompression <= 0.3) {
    tags.push('reasoning:normal');
  }
  
  // Structure tag
  if (bullets >= 3) {
    tags.push('structure:list');
  }
  
  return tags;
}

/**
 * Calculates base metrics from text.
 */
function calculateBaseMetrics(text: string): BaseMetrics {
  const words = tokenize(text).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const bullets = countBullets(text);
  const entropy = computeEntropy(text);
  
  return { words, sentences, bullets, entropy };
}

/**
 * Classification Engine class.
 * 
 * @example
 * const engine = new ClassificationEngine();
 * const result = engine.classify(prompt, output);
 * 
 * console.log(result.intent); // 'summary'
 * console.log(result.hallucinationRisk); // 0.3
 * console.log(result.tags); // ['intent:summary', 'hallucination:low']
 */
export class ClassificationEngine {
  private policy: ClassificationPolicy;
  
  constructor(policy: ClassificationPolicy = {}) {
    this.policy = policy;
  }
  
  /**
   * Classifies LLM output.
   * 
   * @param prompt - The original prompt
   * @param output - The LLM output to classify
   * @returns Complete classification result
   */
  classify(prompt: string, output: string): ClassificationResult {
    // 0. Apply output length cap for performance
    const maxLength = this.policy.performance?.maxOutputLength ?? DEFAULT_MAX_OUTPUT_LENGTH;
    const truncated = output.length > maxLength;
    const processedOutput = truncated ? output.slice(0, maxLength) : output;
    
    // 1. Calculate base metrics
    const baseMetrics = calculateBaseMetrics(processedOutput);
    
    // 2. Detect intent
    const intentCandidates = this.policy.intent?.enabled !== false
      ? detectIntent(processedOutput)
      : [];
    const intent = getPrimaryIntent(intentCandidates);
    
    // 3. Detect and repair JSON (respect maxRepairSteps config)
    const jsonResult = this.policy.json?.enabled !== false
      ? detectAndRepairJson(processedOutput, this.policy.json?.maxRepairSteps)
      : { isJson: false, candidate: null, normalizedJson: undefined, repairSteps: [], repairSucceeded: false };
    const { isJson, normalizedJson } = jsonResult;
    
    // 4. Evaluate instruction rules
    const instructionResult = evaluateInstructionRules(
      output,
      normalizedJson,
      this.policy.instructionRules || [],
      isJson
    );
    
    // 5. Calculate hallucination risk
    let hallucinationSignals = {
      speculativeFactsScore: 0,
      fabricatedKeysScore: 0,
      overconfidentScore: 0,
      contradictionScore: 0,
      customHooksCount: 0
    };
    let hallucinationRisk = 0;
    
    if (this.policy.hallucination?.internalSignals !== false) {
      hallucinationSignals = calculateHallucinationSignals(
        prompt,
        processedOutput,
        normalizedJson,
        this.policy.hallucination?.customHooks
      );
      hallucinationRisk = calculateHallucinationRisk(
        hallucinationSignals,
        prompt,
        processedOutput,
        this.policy.hallucination?.customHooks,
        this.policy.hallucination?.weights
      );
    }
    const hallucinationLabel = getHallucinationLabel(hallucinationRisk);
    
    // 6. Calculate reasoning compression
    let compressionMetrics: CompressionMetrics = {
      complexityLevel: 1,
      expectedWords: 30, // Updated default
      lengthDeficit: 0,
      entropyDrop: 0,
      missingTransitions: 0,
      repetitionScore: 0
    };
    let reasoningCompression = 0;
    
    if (this.policy.compression?.enabled !== false) {
      compressionMetrics = calculateCompressionMetrics(
        prompt,
        processedOutput,
        this.policy.compression?.baselineEntropy,
        this.policy.compression?.expectedWords
      );
      reasoningCompression = calculateCompressionScore(compressionMetrics);
    }
    const reasoningLabel = getReasoningLabel(reasoningCompression);
    
    // 7. Generate tags
    const tags = generateTags(
      intent,
      isJson,
      instructionResult.instructionFollowed,
      hallucinationLabel,
      reasoningCompression,
      baseMetrics.bullets
    );
    
    // 8. Assemble result
    return {
      intent,
      intentCandidates,
      isStructured: baseMetrics.bullets > 0 || isJson,
      isJson,
      normalizedJson,
      instructionFollowed: instructionResult.instructionFollowed,
      instructionCompliance: instructionResult.complianceRatio,
      hallucinationRisk,
      hallucinationLabel,
      reasoningCompression,
      reasoningLabel,
      tags,
      details: {
        baseMetrics,
        intent: { candidates: intentCandidates },
        json: {
          candidate: jsonResult.candidate,
          repairSteps: jsonResult.repairSteps,
          repairSucceeded: jsonResult.repairSucceeded
        },
        instructions: {
          rules: this.policy.instructionRules || [],
          ruleResults: instructionResult.ruleResults,
          complianceRatio: instructionResult.complianceRatio
        },
        hallucination: hallucinationSignals,
        compression: compressionMetrics
      },
      limitations: LIMITATIONS,
      methodology: METHODOLOGY
    };
  }
  
  /**
   * Updates the classification policy.
   */
  setPolicy(policy: ClassificationPolicy): void {
    this.policy = policy;
  }
}

/**
 * Convenience function for one-off classification.
 * 
 * @param prompt - The original prompt
 * @param output - The LLM output to classify
 * @param policy - Optional classification policy
 * @returns Classification result
 * 
 * @example
 * const result = classify(
 *   'Summarize this article',
 *   'The article discusses...',
 *   { instructionRules: [{ id: 'format', type: 'format', params: { expect: 'paragraph' } }] }
 * );
 */
export function classify(
  prompt: string,
  output: string,
  policy?: ClassificationPolicy
): ClassificationResult {
  const engine = new ClassificationEngine(policy);
  return engine.classify(prompt, output);
}
