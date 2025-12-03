/**
 * Instruction-Following Evaluation Module
 * 
 * Evaluates whether LLM output follows specified instruction rules.
 * 
 * @module engines/classification/instruction-eval
 * @author Haiec
 * @license MIT
 */

import { InstructionRule, RuleResult } from './types';
import { tokenize, countBullets } from './utils';

/**
 * Result of instruction evaluation.
 */
export interface InstructionEvalResult {
  ruleResults: RuleResult[];
  complianceRatio: number;
  instructionFollowed: boolean;
}

/**
 * Evaluates a format rule.
 */
function evaluateFormatRule(
  rule: InstructionRule,
  text: string,
  isJson: boolean,
  bullets: number,
  sentences: number
): RuleResult {
  const expect = rule.params.expect;
  
  switch (expect) {
    case 'json':
      return {
        id: rule.id,
        passed: isJson,
        reason: isJson ? undefined : 'Expected JSON output but none found'
      };
    
    case 'list':
      return {
        id: rule.id,
        passed: bullets >= 1,
        reason: bullets >= 1 ? undefined : 'Expected list format but no list items found'
      };
    
    case 'paragraph':
      const isParagraph = bullets === 0 && sentences >= 2;
      return {
        id: rule.id,
        passed: isParagraph,
        reason: isParagraph ? undefined : 'Expected paragraph format'
      };
    
    case 'code':
      const hasCode = /```[\s\S]*```/.test(text) || /^\s{4,}|\t/m.test(text);
      return {
        id: rule.id,
        passed: hasCode,
        reason: hasCode ? undefined : 'Expected code block but none found'
      };
    
    default:
      return { id: rule.id, passed: true };
  }
}

/**
 * Evaluates a length rule.
 */
function evaluateLengthRule(
  rule: InstructionRule,
  words: number,
  bullets: number
): RuleResult {
  const { minWords, maxWords, minBullets, maxBullets } = rule.params;
  const failures: string[] = [];
  
  if (minWords !== undefined && words < minWords) {
    failures.push(`Expected at least ${minWords} words, got ${words}`);
  }
  if (maxWords !== undefined && words > maxWords) {
    failures.push(`Expected at most ${maxWords} words, got ${words}`);
  }
  if (minBullets !== undefined && bullets < minBullets) {
    failures.push(`Expected at least ${minBullets} list items, got ${bullets}`);
  }
  if (maxBullets !== undefined && bullets > maxBullets) {
    failures.push(`Expected at most ${maxBullets} list items, got ${bullets}`);
  }
  
  return {
    id: rule.id,
    passed: failures.length === 0,
    reason: failures.length > 0 ? failures[0] : undefined
  };
}

/**
 * Evaluates an include rule.
 */
function evaluateIncludeRule(
  rule: InstructionRule,
  text: string
): RuleResult {
  const terms = rule.params.terms || [];
  const lower = text.toLowerCase();
  const missing = terms.filter(t => !lower.includes(t.toLowerCase()));
  
  return {
    id: rule.id,
    passed: missing.length === 0,
    reason: missing.length > 0 ? `Missing required terms: ${missing.join(', ')}` : undefined
  };
}

/**
 * Evaluates an exclude rule.
 */
function evaluateExcludeRule(
  rule: InstructionRule,
  text: string
): RuleResult {
  const terms = rule.params.terms || [];
  const lower = text.toLowerCase();
  const found = terms.filter(t => lower.includes(t.toLowerCase()));
  
  return {
    id: rule.id,
    passed: found.length === 0,
    reason: found.length > 0 ? `Found forbidden terms: ${found.join(', ')}` : undefined
  };
}

/**
 * Evaluates a schema rule.
 */
function evaluateSchemaRule(
  rule: InstructionRule,
  normalizedJson: unknown
): RuleResult {
  if (!normalizedJson || typeof normalizedJson !== 'object' || Array.isArray(normalizedJson)) {
    return {
      id: rule.id,
      passed: false,
      reason: 'Expected JSON object for schema validation'
    };
  }
  
  const requiredKeys = rule.params.requiredKeys || [];
  const obj = normalizedJson as Record<string, unknown>;
  const missing = requiredKeys.filter(k => !(k in obj));
  
  return {
    id: rule.id,
    passed: missing.length === 0,
    reason: missing.length > 0 ? `Missing required keys: ${missing.join(', ')}` : undefined
  };
}

/**
 * Evaluates a coverage rule.
 */
function evaluateCoverageRule(
  rule: InstructionRule,
  text: string
): RuleResult {
  const entities = rule.params.entities || [];
  const lower = text.toLowerCase();
  const missing = entities.filter(e => !lower.includes(e.toLowerCase()));
  
  return {
    id: rule.id,
    passed: missing.length === 0,
    reason: missing.length > 0 ? `Missing coverage of: ${missing.join(', ')}` : undefined
  };
}

/**
 * Evaluates all instruction rules against output.
 * 
 * @param text - The output text
 * @param normalizedJson - Parsed JSON if available
 * @param rules - Instruction rules to evaluate
 * @param isJson - Whether output is valid JSON
 * @returns Evaluation result with compliance ratio
 */
export function evaluateInstructionRules(
  text: string,
  normalizedJson: unknown | undefined,
  rules: InstructionRule[],
  isJson: boolean
): InstructionEvalResult {
  if (!rules || rules.length === 0) {
    return {
      ruleResults: [],
      complianceRatio: 1,
      instructionFollowed: true
    };
  }
  
  const words = tokenize(text).length;
  const bullets = countBullets(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  const ruleResults: RuleResult[] = [];
  
  for (const rule of rules) {
    let result: RuleResult;
    
    switch (rule.type) {
      case 'format':
        result = evaluateFormatRule(rule, text, isJson, bullets, sentences);
        break;
      case 'length':
        result = evaluateLengthRule(rule, words, bullets);
        break;
      case 'include':
        result = evaluateIncludeRule(rule, text);
        break;
      case 'exclude':
        result = evaluateExcludeRule(rule, text);
        break;
      case 'schema':
        result = evaluateSchemaRule(rule, normalizedJson);
        break;
      case 'coverage':
        result = evaluateCoverageRule(rule, text);
        break;
      default:
        result = { id: rule.id, passed: true };
    }
    
    ruleResults.push(result);
  }
  
  const passedCount = ruleResults.filter(r => r.passed).length;
  const complianceRatio = rules.length > 0 ? passedCount / rules.length : 1;
  const instructionFollowed = complianceRatio >= 0.8;
  
  return {
    ruleResults,
    complianceRatio,
    instructionFollowed
  };
}
