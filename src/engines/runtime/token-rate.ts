/**
 * Token Rate Engine
 * 
 * Monitors tokens-per-second throughput and detects degradation.
 * Lower token rates may indicate provider throttling or issues.
 * 
 * WHAT THIS DOES:
 * ✅ Calculates tokens per second
 * ✅ Compares to baseline throughput
 * ✅ Detects throughput degradation
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Predict throughput changes
 * ❌ Identify cause of slowdowns
 * ❌ Account for response complexity
 * 
 * @module engines/runtime/token-rate
 * @author Haiec
 * @license MIT
 */

import { CallRecord, EngineResult, BaselineState } from '../../types/runtime';

const LIMITATIONS = [
  'Baseline-dependent: requires sufficient samples',
  'Token count may be estimated if not provided by API',
  'Does not account for response complexity',
  'Cannot distinguish intentional throttling from issues'
];

/**
 * Analyzes token generation rate against baseline.
 * 
 * @param call - The call record to analyze
 * @param baseline - Current baseline state
 * @param thresholds - Optional custom thresholds
 * @returns Engine result with token rate analysis
 * 
 * @example
 * const result = TokenRateEngine(callRecord, baseline);
 * if (result.status === 'warn') {
 *   console.log('Token rate below normal');
 * }
 */
export function TokenRateEngine(
  call: CallRecord,
  baseline: Pick<BaselineState, 'avgTokensPerSecond'>,
  thresholds?: { warnRatio?: number; errorRatio?: number }
): EngineResult {
  const warnRatio = thresholds?.warnRatio ?? 0.8;
  const errorRatio = thresholds?.errorRatio ?? 0.2;

  // Calculate tokens per second (avoid division by zero)
  const seconds = Math.max(call.latencyMs / 1000, 0.001);
  const tps = call.responseTokens / seconds;

  // No baseline yet - return healthy
  if (!baseline || !baseline.avgTokensPerSecond || baseline.avgTokensPerSecond === 0) {
    return {
      metric: 'token_rate',
      value: 0,
      status: 'ok',
      details: {
        tps: Math.round(tps * 100) / 100,
        baselineTps: 0,
        ratio: 0,
        message: 'Baseline not yet established'
      },
      limitations: LIMITATIONS
    };
  }

  const ratio = tps / baseline.avgTokensPerSecond;

  // Normalize value: 0 at warnRatio, 1 at errorRatio (inverted - lower is worse)
  let value: number;
  if (ratio >= warnRatio) {
    value = 0;
  } else if (ratio <= errorRatio) {
    value = 1;
  } else {
    value = (warnRatio - ratio) / (warnRatio - errorRatio);
  }

  // Determine status
  let status: 'ok' | 'warn' | 'error';
  if (value < 0.3) {
    status = 'ok';
  } else if (value < 0.6) {
    status = 'warn';
  } else {
    status = 'error';
  }

  return {
    metric: 'token_rate',
    value,
    status,
    details: {
      tps: Math.round(tps * 100) / 100,
      baselineTps: Math.round(baseline.avgTokensPerSecond * 100) / 100,
      ratio: Math.round(ratio * 100) / 100,
      thresholds: { warnRatio, errorRatio }
    },
    limitations: LIMITATIONS
  };
}
