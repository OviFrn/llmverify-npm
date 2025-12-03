/**
 * Fingerprint Engine
 * 
 * Detects behavioral drift by analyzing response structure patterns.
 * Uses entropy, sentence structure, and length patterns to identify changes.
 * 
 * WHAT THIS DOES:
 * ✅ Calculates response fingerprint (tokens, sentences, entropy)
 * ✅ Compares to baseline fingerprint
 * ✅ Detects structural drift in responses
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Analyze semantic content
 * ❌ Detect quality changes
 * ❌ Identify specific model changes
 * 
 * @module engines/runtime/fingerprint
 * @author Haiec
 * @license MIT
 */

import { CallRecord, EngineResult, ResponseFingerprint } from '../../types/runtime';

const LIMITATIONS = [
  'Structural analysis only - does not assess content quality',
  'Entropy calculation is character-based, not semantic',
  'Requires baseline for meaningful comparison',
  'May flag legitimate style variations as drift'
];

/**
 * Computes Shannon entropy of a text string.
 * Higher entropy indicates more randomness/variety.
 */
function computeEntropy(text: string): number {
  if (!text || text.length === 0) return 0;
  
  const freq: Record<string, number> = {};
  for (const ch of text) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  
  const len = text.length;
  let entropy = 0;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Calculates normalized difference between two values.
 */
function normalizedDiff(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(b, 1);
}

/**
 * Extracts fingerprint from response text.
 */
function extractFingerprint(text: string): ResponseFingerprint {
  const tokens = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0).length || 1;
  const avgSentLength = tokens / sentences;
  const entropy = computeEntropy(text);
  
  return { tokens, sentences, avgSentLength, entropy };
}

/**
 * Analyzes response fingerprint for behavioral drift.
 * 
 * @param call - The call record to analyze
 * @param baselineFingerprint - Baseline fingerprint for comparison
 * @returns Engine result with fingerprint analysis
 * 
 * @example
 * const result = FingerprintEngine(callRecord, baseline.fingerprint);
 * if (result.status === 'warn') {
 *   console.log('Response structure has changed');
 * }
 */
export function FingerprintEngine(
  call: CallRecord,
  baselineFingerprint: ResponseFingerprint | Record<string, never>
): EngineResult {
  const text = call.responseText || '';
  const curr = extractFingerprint(text);

  // No baseline yet - initialize
  if (!baselineFingerprint || !('tokens' in baselineFingerprint) || baselineFingerprint.tokens === undefined) {
    return {
      metric: 'fingerprint',
      value: 0,
      status: 'ok',
      details: {
        initialized: true,
        curr,
        message: 'Fingerprint baseline initialized'
      },
      limitations: LIMITATIONS
    };
  }

  const baseline = baselineFingerprint as ResponseFingerprint;

  // Calculate component differences
  const dLen = normalizedDiff(curr.tokens, baseline.tokens);
  const dSent = normalizedDiff(curr.avgSentLength, baseline.avgSentLength);
  const dSentCount = normalizedDiff(curr.sentences, baseline.sentences);
  const dEnt = normalizedDiff(curr.entropy, baseline.entropy);

  // Weighted composite score
  const value = Math.min(1, 0.25 * dLen + 0.25 * dSent + 0.25 * dSentCount + 0.25 * dEnt);

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
    metric: 'fingerprint',
    value,
    status,
    details: {
      curr,
      baseline,
      diffs: {
        tokenLength: Math.round(dLen * 100) / 100,
        sentenceLength: Math.round(dSent * 100) / 100,
        sentenceCount: Math.round(dSentCount * 100) / 100,
        entropy: Math.round(dEnt * 100) / 100
      }
    },
    limitations: LIMITATIONS
  };
}

/**
 * Utility to extract fingerprint for external use.
 */
export { extractFingerprint };
