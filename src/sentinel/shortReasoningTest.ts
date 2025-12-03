/**
 * Short Reasoning Test
 * 
 * Tests if the LLM can perform basic logical reasoning.
 * Uses simple, verifiable reasoning tasks.
 * 
 * WHAT THIS TESTS:
 * ✅ Basic logical reasoning
 * ✅ Step-by-step thinking
 * ✅ Correct conclusion derivation
 * 
 * LIMITATIONS:
 * - Tests very basic reasoning only
 * - May not detect subtle reasoning errors
 * - Answer extraction may miss valid formats
 * 
 * @module sentinel/shortReasoningTest
 * @author Haiec
 * @license MIT
 */

import { SentinelTestResult, SentinelConfig } from '../types/runtime';

const LIMITATIONS = [
  'Tests very basic reasoning only',
  'May not detect subtle reasoning errors',
  'Answer extraction may miss valid response formats',
  'Does not test complex multi-step reasoning'
];

// Simple reasoning problems with known answers
const REASONING_PROBLEMS = [
  {
    prompt: 'If all cats are animals, and Whiskers is a cat, is Whiskers an animal? Answer yes or no.',
    expectedAnswer: 'yes',
    type: 'syllogism'
  },
  {
    prompt: 'I have 5 apples. I give away 2. How many do I have left? Answer with just the number.',
    expectedAnswer: '3',
    type: 'arithmetic'
  },
  {
    prompt: 'Which is larger: 100 or 99? Answer with just the number.',
    expectedAnswer: '100',
    type: 'comparison'
  }
];

/**
 * Tests if the LLM can perform basic reasoning.
 * 
 * @param config - Sentinel configuration with LLM client
 * @returns Test result with reasoning analysis
 * 
 * @example
 * const result = await shortReasoningTest({
 *   client: myLLMClient,
 *   model: 'gpt-4'
 * });
 * 
 * if (!result.passed) {
 *   console.error('Reasoning test failed');
 * }
 */
export async function shortReasoningTest(config: SentinelConfig): Promise<SentinelTestResult> {
  const results: Array<{
    problem: typeof REASONING_PROBLEMS[0];
    response: string;
    correct: boolean;
  }> = [];

  try {
    // Test each reasoning problem
    for (const problem of REASONING_PROBLEMS) {
      const response = await config.client.generate({
        prompt: problem.prompt,
        model: config.model
      });

      const text = response.text.trim().toLowerCase();
      
      // Check if response contains expected answer
      const correct = text.includes(problem.expectedAnswer.toLowerCase());

      results.push({
        problem,
        response: response.text.trim().substring(0, 100),
        correct
      });
    }

    // Calculate success rate
    const correctCount = results.filter(r => r.correct).length;
    const successRate = correctCount / REASONING_PROBLEMS.length;

    // Pass if at least 2/3 problems are correct
    const passed = successRate >= 0.66;

    return {
      test: 'shortReasoningTest',
      passed,
      message: passed
        ? `LLM passed ${correctCount}/${REASONING_PROBLEMS.length} reasoning tests`
        : `LLM failed reasoning tests: ${correctCount}/${REASONING_PROBLEMS.length} correct`,
      details: {
        totalProblems: REASONING_PROBLEMS.length,
        correctCount,
        successRate: Math.round(successRate * 100) / 100,
        results: results.map(r => ({
          type: r.problem.type,
          expected: r.problem.expectedAnswer,
          response: r.response,
          correct: r.correct
        }))
      },
      confidence: successRate > 0.9 ? 0.9 : 0.75,
      limitations: LIMITATIONS
    };
  } catch (error) {
    return {
      test: 'shortReasoningTest',
      passed: false,
      message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        completedTests: results.length
      },
      confidence: 0.5,
      limitations: [...LIMITATIONS, 'Test failed due to error']
    };
  }
}
