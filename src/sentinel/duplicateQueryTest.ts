/**
 * Duplicate Query Test
 * 
 * Tests if the LLM provides consistent responses to identical queries.
 * Helps detect non-deterministic behavior or model instability.
 * 
 * WHAT THIS TESTS:
 * ✅ Response consistency
 * ✅ Deterministic behavior
 * ✅ Model stability
 * 
 * LIMITATIONS:
 * - Some variation is expected and normal
 * - Temperature settings affect consistency
 * - Does not test correctness, only consistency
 * 
 * @module sentinel/duplicateQueryTest
 * @author Haiec
 * @license MIT
 */

import { SentinelTestResult, SentinelConfig } from '../types/runtime';

const LIMITATIONS = [
  'Some response variation is expected and normal',
  'Temperature and sampling settings affect consistency',
  'Tests consistency, not correctness',
  'May flag legitimate paraphrasing as inconsistency'
];

const TEST_QUERY = 'What is 2 + 2? Answer with just the number.';

/**
 * Tests if the LLM provides consistent responses to the same query.
 * 
 * @param config - Sentinel configuration with LLM client
 * @param iterations - Number of times to repeat the query (default: 3)
 * @returns Test result with consistency analysis
 * 
 * @example
 * const result = await duplicateQueryTest({
 *   client: myLLMClient,
 *   model: 'gpt-4'
 * }, 5);
 * 
 * if (!result.passed) {
 *   console.warn('Inconsistent responses detected');
 * }
 */
export async function duplicateQueryTest(
  config: SentinelConfig,
  iterations: number = 3
): Promise<SentinelTestResult> {
  const responses: string[] = [];

  try {
    // Run multiple queries
    for (let i = 0; i < iterations; i++) {
      const response = await config.client.generate({
        prompt: TEST_QUERY,
        model: config.model
      });
      responses.push(response.text.trim().toLowerCase());
    }

    // Analyze consistency
    const uniqueResponses = new Set(responses);
    const consistencyRatio = 1 - (uniqueResponses.size - 1) / iterations;
    
    // Check if all responses contain "4"
    const correctResponses = responses.filter(r => r.includes('4')).length;
    const correctRatio = correctResponses / iterations;

    // Calculate semantic similarity between responses
    const similarities: number[] = [];
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similarities.push(calculateSimilarity(responses[i], responses[j]));
      }
    }
    const avgSimilarity = similarities.length > 0 
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length 
      : 1;

    // Pass if responses are consistent (>80% same) and correct (>80% contain "4")
    const passed = consistencyRatio >= 0.8 && correctRatio >= 0.8;

    return {
      test: 'duplicateQueryTest',
      passed,
      message: passed
        ? `LLM provided consistent responses across ${iterations} queries`
        : `Inconsistent responses detected: ${uniqueResponses.size} unique responses from ${iterations} queries`,
      details: {
        query: TEST_QUERY,
        iterations,
        uniqueResponses: Array.from(uniqueResponses),
        consistencyRatio: Math.round(consistencyRatio * 100) / 100,
        correctRatio: Math.round(correctRatio * 100) / 100,
        avgSimilarity: Math.round(avgSimilarity * 100) / 100
      },
      confidence: avgSimilarity > 0.9 ? 0.9 : 0.7,
      limitations: LIMITATIONS
    };
  } catch (error) {
    return {
      test: 'duplicateQueryTest',
      passed: false,
      message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        responsesCollected: responses.length
      },
      confidence: 0.5,
      limitations: [...LIMITATIONS, 'Test failed due to error']
    };
  }
}

/**
 * Calculates similarity between two strings.
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  
  const aWords = new Set(a.split(/\s+/));
  const bWords = new Set(b.split(/\s+/));
  
  let matches = 0;
  for (const word of aWords) {
    if (bWords.has(word)) matches++;
  }
  
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? matches / union : 0;
}
