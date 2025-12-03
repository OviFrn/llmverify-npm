/**
 * Sentinel Tests Module
 * 
 * Proactive tests to verify LLM behavior and detect issues.
 * These are synthetic tests that can be run periodically to ensure
 * the LLM is responding correctly.
 * 
 * WHAT THIS DOES:
 * ✅ Provides standardized test prompts
 * ✅ Validates expected response patterns
 * ✅ Detects behavioral changes
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Guarantee LLM correctness
 * ❌ Test all possible failure modes
 * ❌ Replace comprehensive testing
 * 
 * @module sentinel
 * @author Haiec
 * @license MIT
 */

export { staticEchoTest } from './staticEchoTest';
export { duplicateQueryTest } from './duplicateQueryTest';
export { structuredListTest } from './structuredListTest';
export { shortReasoningTest } from './shortReasoningTest';
export { runAllSentinelTests, SentinelSuite } from './suite';
