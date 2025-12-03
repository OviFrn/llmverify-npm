/**
 * Health Score Engine
 * 
 * Aggregates engine results into a composite health score.
 * Provides actionable health status and recommendations.
 * 
 * WHAT THIS DOES:
 * ✅ Combines multiple engine results
 * ✅ Calculates weighted health score
 * ✅ Provides actionable status levels
 * ✅ Generates recommendations
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Predict future health
 * ❌ Identify root causes
 * ❌ Guarantee accuracy of individual engines
 * 
 * @module engines/runtime/health-score
 * @author Haiec
 * @license MIT
 */

import { EngineResult, HealthReport, HealthStatus } from '../../types/runtime';

/**
 * Default weights for each metric.
 * Consistency and latency are weighted higher as they're most impactful.
 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  consistency: 0.25,
  structure: 0.15,
  latency: 0.25,
  token_rate: 0.15,
  fingerprint: 0.20
};

/**
 * Generates recommendations based on engine results.
 */
function generateRecommendations(results: EngineResult[]): string[] {
  const recommendations: string[] = [];

  for (const result of results) {
    if (result.status === 'error') {
      switch (result.metric) {
        case 'latency':
          recommendations.push('High latency detected. Consider checking provider status or implementing retry logic.');
          break;
        case 'token_rate':
          recommendations.push('Low token rate detected. Provider may be throttling or experiencing issues.');
          break;
        case 'fingerprint':
          recommendations.push('Response structure has changed significantly. Verify model behavior.');
          break;
        case 'structure':
          recommendations.push('Structural anomalies detected. Check for truncation or format issues.');
          break;
        case 'consistency':
          recommendations.push('Response consistency issues detected. Consider implementing validation.');
          break;
      }
    } else if (result.status === 'warn') {
      switch (result.metric) {
        case 'latency':
          recommendations.push('Latency slightly elevated. Monitor for trends.');
          break;
        case 'token_rate':
          recommendations.push('Token rate below normal. May indicate early throttling.');
          break;
        case 'fingerprint':
          recommendations.push('Minor structural drift detected. May be normal variation.');
          break;
      }
    }
  }

  return recommendations;
}

/**
 * Aggregates engine results into a health report.
 * 
 * @param results - Array of engine results to aggregate
 * @param weights - Optional custom weights for each metric
 * @returns Comprehensive health report
 * 
 * @example
 * const results = [latencyResult, tokenRateResult, fingerprintResult];
 * const report = HealthScoreEngine(results);
 * 
 * if (report.health === 'unstable') {
 *   alert('LLM health critical!');
 * }
 */
export function HealthScoreEngine(
  results: EngineResult[],
  weights?: Record<string, number>
): HealthReport {
  const effectiveWeights = { ...DEFAULT_WEIGHTS, ...weights };

  // Calculate weighted score
  let score = 0;
  let totalWeight = 0;

  for (const result of results) {
    const weight = effectiveWeights[result.metric] || 0.1;
    score += result.value * weight;
    totalWeight += weight;
  }

  // Normalize score
  score = totalWeight > 0 ? Math.min(1, score / totalWeight * Object.keys(effectiveWeights).length / results.length) : 0;
  score = Math.min(1, score);

  // Determine health status
  let health: HealthStatus;
  if (score <= 0.25) {
    health = 'stable';
  } else if (score <= 0.5) {
    health = 'minor_variation';
  } else if (score <= 0.75) {
    health = 'degraded';
  } else {
    health = 'unstable';
  }

  // Check for any critical errors that should override
  const hasError = results.some(r => r.status === 'error');
  if (hasError && health === 'stable') {
    health = 'minor_variation';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(results);

  return {
    health,
    score: Math.round(score * 100) / 100,
    engineResults: results,
    timestamp: Date.now(),
    recommendations: recommendations.length > 0 ? recommendations : undefined
  };
}

/**
 * Quick health check - returns true if healthy.
 */
export function isHealthy(report: HealthReport): boolean {
  return report.health === 'stable' || report.health === 'minor_variation';
}

/**
 * Gets severity level for alerting.
 */
export function getAlertLevel(report: HealthReport): 'none' | 'info' | 'warning' | 'critical' {
  switch (report.health) {
    case 'stable':
      return 'none';
    case 'minor_variation':
      return 'info';
    case 'degraded':
      return 'warning';
    case 'unstable':
      return 'critical';
  }
}
