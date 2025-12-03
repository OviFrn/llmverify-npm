/**
 * JSON Detection and Repair Module
 * 
 * Detects JSON in text and attempts to repair malformed JSON.
 * 
 * @module engines/classification/json-repair
 * @author Haiec
 * @license MIT
 */

import { JsonRepairStep } from './types';

/**
 * Result of JSON detection and repair.
 */
export interface JsonDetectionResult {
  isJson: boolean;
  normalizedJson?: unknown;
  candidate: string | null;
  repairSteps: JsonRepairStep[];
  repairSucceeded: boolean;
}

/**
 * Extracts JSON candidate from text.
 */
function extractJsonCandidate(text: string): string | null {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const content = codeBlockMatch[1].trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }
  
  // Look for JSON-like patterns
  const jsonPatterns = [
    /(\{[\s\S]*\})/,  // Object
    /(\[[\s\S]*\])/   // Array
  ];
  
  for (const pattern of jsonPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Attempts to parse JSON, returns null if invalid.
 */
function tryParse(json: string): unknown | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Repair step: Remove trailing commas.
 */
function removeTrailingCommas(json: string): string {
  // Remove trailing commas before } or ]
  return json.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Repair step: Add missing quotes to keys.
 */
function quoteUnquotedKeys(json: string): string {
  // Match unquoted keys followed by :
  return json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
}

/**
 * Repair step: Replace single quotes with double quotes.
 */
function replaceSingleQuotes(json: string): string {
  // Simple replacement - may not handle all edge cases
  let result = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const prevChar = i > 0 ? json[i - 1] : '';
    
    if (!inString) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        result += '"';
      } else {
        result += char;
      }
    } else {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
        result += '"';
      } else if (char === '"' && stringChar === "'") {
        result += '\\"';
      } else {
        result += char;
      }
    }
  }
  
  return result;
}

/**
 * Repair step: Escape unescaped newlines in strings.
 */
function escapeNewlines(json: string): string {
  // This is a simplified version - proper implementation would need state tracking
  return json.replace(/(?<!\\)\n/g, '\\n');
}

/**
 * Repair step: Close unclosed braces and brackets.
 */
function closeBrackets(json: string): string {
  let braceCount = 0;
  let bracketCount = 0;
  
  for (const char of json) {
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
  }
  
  let result = json;
  while (bracketCount > 0) {
    result += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    result += '}';
    braceCount--;
  }
  
  return result;
}

/**
 * Repair step: Remove JavaScript-style comments.
 */
function removeComments(json: string): string {
  // Remove single-line comments
  let result = json.replace(/\/\/[^\n]*/g, '');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

/** Default maximum repair steps */
const DEFAULT_MAX_REPAIR_STEPS = 6;

/**
 * Detects and repairs JSON in text.
 * 
 * @param text - The text to analyze
 * @param maxRepairSteps - Maximum repair steps to attempt (default: 6)
 * @returns JSON detection result with repair information
 */
export function detectAndRepairJson(
  text: string,
  maxRepairSteps: number = DEFAULT_MAX_REPAIR_STEPS
): JsonDetectionResult {
  const candidate = extractJsonCandidate(text);
  const repairSteps: JsonRepairStep[] = [];
  
  if (!candidate) {
    return {
      isJson: false,
      candidate: null,
      repairSteps: [],
      repairSucceeded: false
    };
  }
  
  // Try parsing as-is first
  let parsed = tryParse(candidate);
  if (parsed !== null) {
    return {
      isJson: true,
      normalizedJson: parsed,
      candidate,
      repairSteps: [],
      repairSucceeded: true
    };
  }
  
  // Apply repair steps in order (limited by maxRepairSteps)
  const repairs: Array<{ name: string; fn: (s: string) => string }> = [
    { name: 'remove_comments', fn: removeComments },
    { name: 'remove_trailing_commas', fn: removeTrailingCommas },
    { name: 'quote_unquoted_keys', fn: quoteUnquotedKeys },
    { name: 'replace_single_quotes', fn: replaceSingleQuotes },
    { name: 'escape_newlines', fn: escapeNewlines },
    { name: 'close_brackets', fn: closeBrackets }
  ].slice(0, maxRepairSteps);
  
  let current = candidate;
  
  for (const repair of repairs) {
    const before = current;
    current = repair.fn(current);
    const applied = current !== before;
    
    repairSteps.push({
      step: repair.name,
      applied
    });
    
    // Try parsing after each step
    if (applied) {
      parsed = tryParse(current);
      if (parsed !== null) {
        return {
          isJson: true,
          normalizedJson: parsed,
          candidate,
          repairSteps,
          repairSucceeded: true
        };
      }
    }
  }
  
  // All repairs failed
  return {
    isJson: false,
    candidate,
    repairSteps,
    repairSucceeded: false
  };
}
