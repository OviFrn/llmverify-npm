/**
 * Structured List Test
 * 
 * Tests if the LLM can generate properly structured list output.
 * Validates format compliance and structural consistency.
 * 
 * WHAT THIS TESTS:
 * ✅ List formatting capability
 * ✅ Instruction following for structure
 * ✅ Consistent formatting patterns
 * 
 * LIMITATIONS:
 * - Format variations may be valid but flagged
 * - Does not validate list content accuracy
 * - May be too strict for creative responses
 * 
 * @module sentinel/structuredListTest
 * @author Haiec
 * @license MIT
 */

import { SentinelTestResult, SentinelConfig } from '../types/runtime';

const LIMITATIONS = [
  'Format variations may be valid but flagged as failures',
  'Does not validate content accuracy',
  'May be too strict for creative or conversational models',
  'Different models have different formatting conventions'
];

const TEST_QUERY = 'List exactly 3 colors. Format as a numbered list (1. 2. 3.)';

/**
 * Tests if the LLM can generate a properly structured list.
 * 
 * @param config - Sentinel configuration with LLM client
 * @returns Test result with structure analysis
 * 
 * @example
 * const result = await structuredListTest({
 *   client: myLLMClient,
 *   model: 'gpt-4'
 * });
 * 
 * if (result.passed) {
 *   console.log('LLM can generate structured lists');
 * }
 */
export async function structuredListTest(config: SentinelConfig): Promise<SentinelTestResult> {
  try {
    const response = await config.client.generate({
      prompt: TEST_QUERY,
      model: config.model
    });

    const text = response.text.trim();

    // Check for numbered list patterns
    const numberedPattern = /^\s*[1-3][.)]\s*.+$/gm;
    const numberedMatches = text.match(numberedPattern) || [];

    // Check for bullet list patterns (alternative valid format)
    const bulletPattern = /^\s*[-*•]\s*.+$/gm;
    const bulletMatches = text.match(bulletPattern) || [];

    // Check for line-separated items
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // Determine list type and count
    const hasNumberedList = numberedMatches.length >= 3;
    const hasBulletList = bulletMatches.length >= 3;
    const hasLineList = lines.length >= 3;

    // Check for color words
    const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 
                        'black', 'white', 'brown', 'gray', 'grey', 'cyan', 'magenta'];
    const foundColors = colorWords.filter(c => text.toLowerCase().includes(c));

    // Pass if we have a list structure with at least 3 items and some colors
    const hasValidStructure = hasNumberedList || hasBulletList || hasLineList;
    const hasColors = foundColors.length >= 2;
    const passed = hasValidStructure && hasColors;

    return {
      test: 'structuredListTest',
      passed,
      message: passed
        ? 'LLM generated a properly structured list'
        : `List structure issues: ${!hasValidStructure ? 'No valid list format detected' : 'Missing expected content'}`,
      details: {
        query: TEST_QUERY,
        response: text.substring(0, 300),
        numberedItems: numberedMatches.length,
        bulletItems: bulletMatches.length,
        lineItems: lines.length,
        foundColors,
        hasValidStructure,
        listType: hasNumberedList ? 'numbered' : hasBulletList ? 'bullet' : hasLineList ? 'line' : 'none'
      },
      confidence: hasValidStructure ? 0.85 : 0.6,
      limitations: LIMITATIONS
    };
  } catch (error) {
    return {
      test: 'structuredListTest',
      passed: false,
      message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      confidence: 0.5,
      limitations: [...LIMITATIONS, 'Test failed due to error']
    };
  }
}
