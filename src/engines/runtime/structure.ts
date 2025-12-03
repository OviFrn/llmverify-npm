/**
 * Structure Engine
 * 
 * Analyzes response structure for expected patterns.
 * Detects JSON, lists, code blocks, and other structural elements.
 * 
 * WHAT THIS DOES:
 * ✅ Detects JSON in responses
 * ✅ Counts list items and bullet points
 * ✅ Identifies code blocks
 * ✅ Flags unstructured responses when structure expected
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Validate JSON schema
 * ❌ Assess content quality
 * ❌ Determine if structure is appropriate for query
 * 
 * @module engines/runtime/structure
 * @author Haiec
 * @license MIT
 */

import { CallRecord, EngineResult } from '../../types/runtime';

const LIMITATIONS = [
  'Pattern-based detection only',
  'Cannot determine if structure is appropriate for the query',
  'May miss custom formatting patterns',
  'Does not validate structural correctness'
];

/**
 * Checks if text contains valid JSON.
 */
function containsJSON(text: string): { found: boolean; valid: boolean } {
  // Look for JSON-like patterns
  const jsonPatterns = [
    /\{[\s\S]*\}/,  // Object
    /\[[\s\S]*\]/   // Array
  ];

  for (const pattern of jsonPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        JSON.parse(match[0]);
        return { found: true, valid: true };
      } catch {
        return { found: true, valid: false };
      }
    }
  }

  return { found: false, valid: false };
}

/**
 * Counts list items in text.
 */
function countListItems(text: string): number {
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
 * Counts code blocks in text.
 */
function countCodeBlocks(text: string): number {
  const fencedBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  const indentedBlocks = (text.match(/^(    |\t).+$/gm) || []).length;
  return fencedBlocks + Math.floor(indentedBlocks / 3); // Group indented lines
}

/**
 * Counts headers/sections in text.
 */
function countHeaders(text: string): number {
  const markdownHeaders = (text.match(/^#{1,6}\s+.+$/gm) || []).length;
  const underlineHeaders = (text.match(/^.+\n[=-]+$/gm) || []).length;
  return markdownHeaders + underlineHeaders;
}

/**
 * Analyzes response structure for patterns.
 * 
 * @param call - The call record to analyze
 * @param expectStructure - Whether structure is expected (optional)
 * @returns Engine result with structure analysis
 * 
 * @example
 * const result = StructureEngine(callRecord);
 * if (result.details.isJson) {
 *   console.log('Response contains JSON');
 * }
 */
export function StructureEngine(
  call: CallRecord,
  expectStructure?: boolean
): EngineResult {
  const text = call.responseText || '';

  // Analyze structure
  const json = containsJSON(text);
  const listCount = countListItems(text);
  const codeBlockCount = countCodeBlocks(text);
  const headerCount = countHeaders(text);

  // Count structural elements
  const structuralElements = [
    json.found,
    listCount > 0,
    codeBlockCount > 0,
    headerCount > 0
  ].filter(Boolean).length;

  // Calculate anomaly score
  let anomalies = 0;
  const maxAnomalies = 3;

  // Check for broken JSON
  if (json.found && !json.valid) anomalies++;

  // Check for no structure when expected
  if (expectStructure && structuralElements === 0) anomalies++;

  // Check for very short responses (potential truncation)
  if (text.length < 50 && call.responseTokens > 10) anomalies++;

  const value = anomalies / maxAnomalies;

  // Determine status
  let status: 'ok' | 'warn' | 'error';
  if (value === 0) {
    status = 'ok';
  } else if (value < 0.5) {
    status = 'warn';
  } else {
    status = 'error';
  }

  return {
    metric: 'structure',
    value,
    status,
    details: {
      isJson: json.found,
      jsonValid: json.valid,
      listCount,
      codeBlockCount,
      headerCount,
      structuralElements,
      anomalies,
      textLength: text.length
    },
    limitations: LIMITATIONS
  };
}
