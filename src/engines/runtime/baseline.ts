/**
 * Baseline Engine
 * 
 * Maintains and updates baseline metrics for drift detection.
 * Uses exponential moving average for stability.
 * 
 * WHAT THIS DOES:
 * ✅ Tracks average latency, token rate, similarity
 * ✅ Maintains response fingerprint baseline
 * ✅ Uses EMA for smooth baseline updates
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Persist baselines across sessions (in-memory only)
 * ❌ Account for intentional model changes
 * ❌ Distinguish normal variation from anomalies
 * 
 * @module engines/runtime/baseline
 * @author Haiec
 * @license MIT
 */

import { CallRecord, BaselineState, ResponseFingerprint } from '../../types/runtime';

/**
 * Manages baseline state for LLM monitoring.
 * 
 * @example
 * const baseline = new BaselineEngine();
 * 
 * // After each call
 * baseline.update(callRecord, fingerprint, similarity);
 * 
 * // Get current baseline
 * const state = baseline.get();
 */
export class BaselineEngine {
  private baseline: BaselineState;
  private readonly learningRate: number;
  private readonly minSamples: number;

  /**
   * Creates a new BaselineEngine.
   * 
   * @param learningRate - EMA learning rate (0-1, default: 0.1)
   * @param minSamples - Minimum samples before baseline is stable (default: 5)
   */
  constructor(learningRate: number = 0.1, minSamples: number = 5) {
    this.learningRate = Math.max(0.01, Math.min(1, learningRate));
    this.minSamples = minSamples;
    this.baseline = {
      avgLatencyMs: 0,
      avgTokensPerSecond: 0,
      avgSimilarity: 0.85,
      fingerprint: {},
      sampleCount: 0
    };
  }

  /**
   * Updates baseline with new call data.
   * 
   * @param call - The call record
   * @param fingerprint - Response fingerprint
   * @param similarity - Similarity score (0-1)
   */
  update(call: CallRecord, fingerprint: ResponseFingerprint, similarity: number = 1): void {
    const alpha = this.learningRate;
    const tps = call.responseTokens / Math.max(call.latencyMs / 1000, 0.001);

    if (this.baseline.sampleCount === 0) {
      // First sample - initialize directly
      this.baseline.avgLatencyMs = call.latencyMs;
      this.baseline.avgTokensPerSecond = tps;
      this.baseline.fingerprint = fingerprint;
      this.baseline.avgSimilarity = similarity;
    } else {
      // EMA update
      this.baseline.avgLatencyMs = alpha * call.latencyMs + (1 - alpha) * this.baseline.avgLatencyMs;
      this.baseline.avgTokensPerSecond = alpha * tps + (1 - alpha) * this.baseline.avgTokensPerSecond;
      this.baseline.avgSimilarity = alpha * similarity + (1 - alpha) * this.baseline.avgSimilarity;

      // Update fingerprint with EMA
      if (this.baseline.fingerprint && 'tokens' in this.baseline.fingerprint) {
        const fp = this.baseline.fingerprint as ResponseFingerprint;
        this.baseline.fingerprint = {
          tokens: alpha * fingerprint.tokens + (1 - alpha) * fp.tokens,
          sentences: alpha * fingerprint.sentences + (1 - alpha) * fp.sentences,
          avgSentLength: alpha * fingerprint.avgSentLength + (1 - alpha) * fp.avgSentLength,
          entropy: alpha * fingerprint.entropy + (1 - alpha) * fp.entropy
        };
      } else {
        this.baseline.fingerprint = fingerprint;
      }
    }

    this.baseline.sampleCount++;
  }

  /**
   * Gets current baseline state.
   */
  get(): BaselineState {
    return { ...this.baseline };
  }

  /**
   * Checks if baseline has enough samples to be stable.
   */
  isStable(): boolean {
    return this.baseline.sampleCount >= this.minSamples;
  }

  /**
   * Resets baseline to initial state.
   */
  reset(): void {
    this.baseline = {
      avgLatencyMs: 0,
      avgTokensPerSecond: 0,
      avgSimilarity: 0.85,
      fingerprint: {},
      sampleCount: 0
    };
  }

  /**
   * Gets sample count.
   */
  getSampleCount(): number {
    return this.baseline.sampleCount;
  }
}
