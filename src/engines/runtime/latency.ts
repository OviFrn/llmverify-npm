/**
 * Latency Engine
 * 
 * Monitors LLM response latency and detects anomalies.
 * Uses baseline comparison to identify performance degradation.
 * 
 * WHAT THIS DOES:
 * ✅ Compares current latency to established baseline
 * ✅ Detects sudden latency spikes
 * ✅ Provides normalized anomaly score
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Predict future latency
 * ❌ Identify root cause of latency issues
 * ❌ Account for network conditions
 * 
 * @module engines/runtime/latency
 * @author Haiec
 * @license MIT
 */

import { CallRecord, EngineResult, BaselineState } from '../../types/runtime';

const LIMITATIONS = [
  'Baseline-dependent: requires sufficient samples for accuracy',
  'Does not account for network variability',
  'Cannot distinguish provider issues from client issues',
  'Thresholds are heuristic-based'
];

/**
 * Analyzes latency of an LLM call against baseline.
 * 
 * @param call - The call record to analyze
 * @param baseline - Current baseline state
 * @param thresholds - Optional custom thresholds
 * @returns Engine result with latency analysis
 * 
 * @example
 * const result = LatencyEngine(callRecord, baseline);
 * if (result.status === 'error') {
 *   console.log('Latency spike detected');
 * }
 */
export function LatencyEngine(
  call: CallRecord,
  baseline: Pick<BaselineState, 'avgLatencyMs'>,
  thresholds?: { warnRatio?: number; errorRatio?: number }
): EngineResult {
  const warnRatio = thresholds?.warnRatio ?? 1.2;
  const errorRatio = thresholds?.errorRatio ?? 3.0;

  // No baseline yet - return healthy
  if (!baseline || !baseline.avgLatencyMs || baseline.avgLatencyMs === 0) {
    return {
      metric: 'latency',
      value: 0,
      status: 'ok',
      details: {
        latencyMs: call.latencyMs,
        baselineAvg: 0,
        ratio: 0,
        message: 'Baseline not yet established'
      },
      limitations: LIMITATIONS
    };
  }

  const ratio = call.latencyMs / baseline.avgLatencyMs;
  
  // Normalize value: 0 at warnRatio, 1 at errorRatio
  let value: number;
  if (ratio <= warnRatio) {
    value = 0;
  } else if (ratio >= errorRatio) {
    value = 1;
  } else {
    value = (ratio - warnRatio) / (errorRatio - warnRatio);
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
    metric: 'latency',
    value,
    status,
    details: {
      latencyMs: call.latencyMs,
      baselineAvg: baseline.avgLatencyMs,
      ratio: Math.round(ratio * 100) / 100,
      thresholds: { warnRatio, errorRatio }
    },
    limitations: LIMITATIONS
  };
}
