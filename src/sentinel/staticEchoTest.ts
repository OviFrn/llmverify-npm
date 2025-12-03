/**
 * Static Echo Test
 * 
 * Tests if the LLM can accurately echo back a specific phrase.
 * This is a basic sanity check for response accuracy.
 * 
 * WHAT THIS TESTS:
 * ✅ Basic response capability
 * ✅ Instruction following
 * ✅ Text reproduction accuracy
 * 
 * LIMITATIONS:
 * - Very basic test, may pass even with degraded models
 * - Does not test reasoning or complex behavior
 * - May fail due to model safety filters
 * 
 * @module sentinel/staticEchoTest
 * @author Haiec
 * @license MIT
 */

import { SentinelTestResult, SentinelConfig } from '../types/runtime';

const LIMITATIONS = [
  'Basic test - may pass even with degraded models',
  'Does not test reasoning capabilities',
  'May fail due to model safety filters on certain phrases',
  'Exact match requirement may be too strict for some models'
];

const TEST_PHRASE = 'The quick brown fox jumps over the lazy dog.';

/**
 * Tests if the LLM can echo back a specific phrase.
 * 
 * @param config - Sentinel configuration with LLM client
 * @returns Test result with pass/fail and details
 * 
 * @example
 * const result = await staticEchoTest({
 *   client: myLLMClient,
 *   model: 'gpt-4'
 * });
 * 
 * if (!result.passed) {
 *   console.error('Echo test failed:', result.message);
 * }
 */
export async function staticEchoTest(config: SentinelConfig): Promise<SentinelTestResult> {
  const prompt = `Please repeat the following phrase exactly, with no additional text: "${TEST_PHRASE}"`;

  try {
    const response = await config.client.generate({
      prompt,
      model: config.model
    });

    const responseText = response.text.trim();
    
    // Check for exact match
    const exactMatch = responseText === TEST_PHRASE;
    
    // Check for contains (more lenient)
    const containsPhrase = responseText.includes(TEST_PHRASE);
    
    // Calculate similarity
    const similarity = calculateSimilarity(responseText, TEST_PHRASE);

    const passed = exactMatch || (containsPhrase && similarity > 0.9);

    return {
      test: 'staticEchoTest',
      passed,
      message: passed 
        ? 'LLM correctly echoed the test phrase'
        : `LLM response did not match expected phrase. Got: "${responseText.substring(0, 100)}"`,
      details: {
        expectedPhrase: TEST_PHRASE,
        actualResponse: responseText.substring(0, 200),
        exactMatch,
        containsPhrase,
        similarity: Math.round(similarity * 100) / 100
      },
      confidence: passed ? 0.95 : 0.8,
      limitations: LIMITATIONS
    };
  } catch (error) {
    return {
      test: 'staticEchoTest',
      passed: false,
      message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      confidence: 0.5,
      limitations: [...LIMITATIONS, 'Test failed due to error, not model behavior']
    };
  }
}

/**
 * Calculates simple similarity between two strings.
 */
function calculateSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  if (aLower === bLower) return 1;
  
  const aWords = new Set(aLower.split(/\s+/));
  const bWords = new Set(bLower.split(/\s+/));
  
  let matches = 0;
  for (const word of aWords) {
    if (bWords.has(word)) matches++;
  }
  
  return matches / Math.max(aWords.size, bWords.size);
}
