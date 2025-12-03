/**
 * Runtime Monitoring Types
 * 
 * Types for LLM runtime health monitoring, performance tracking,
 * and behavioral fingerprinting.
 * 
 * WHAT THIS PROVIDES:
 * ✅ Structured call records for LLM interactions
 * ✅ Engine result standardization
 * ✅ Baseline state for drift detection
 * ✅ Health reporting with actionable status
 * 
 * WHAT THIS DOES NOT DO:
 * ❌ Store sensitive data (prompts/responses are transient)
 * ❌ Make predictions about LLM behavior
 * ❌ Guarantee detection of all anomalies
 * 
 * @module types/runtime
 * @author Haiec
 * @license MIT
 */

/**
 * Record of a single LLM API call.
 * All fields are captured at call time and are ephemeral.
 */
export interface CallRecord {
  /** Unique identifier for this call (UUID v4) */
  id: string;
  /** Unix timestamp when call was initiated */
  timestamp: number;
  /** The prompt sent to the LLM (not stored, only used for analysis) */
  prompt: string;
  /** Model identifier (e.g., "gpt-4", "claude-3") */
  model: string;
  /** Response text from the LLM */
  responseText: string;
  /** Token count of the response */
  responseTokens: number;
  /** End-to-end latency in milliseconds */
  latencyMs: number;
  /** Optional: Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Status indicator for engine results.
 * - ok: Within normal parameters
 * - warn: Deviation detected, may warrant attention
 * - error: Significant anomaly detected
 */
export type EngineStatus = 'ok' | 'warn' | 'error';

/**
 * Standardized result from any runtime engine.
 * All engines return this format for consistent aggregation.
 */
export interface EngineResult {
  /** Metric name (e.g., "latency", "token_rate", "fingerprint") */
  metric: string;
  /** Normalized value 0-1 (0 = healthy, 1 = anomalous) */
  value: number;
  /** Status indicator */
  status: EngineStatus;
  /** Engine-specific details for debugging */
  details: Record<string, unknown>;
  /** Optional: Limitations of this specific check */
  limitations?: string[];
}

/**
 * Response fingerprint for behavioral drift detection.
 * Captures structural characteristics without storing content.
 */
export interface ResponseFingerprint {
  /** Total token count */
  tokens: number;
  /** Sentence count */
  sentences: number;
  /** Average sentence length in tokens */
  avgSentLength: number;
  /** Shannon entropy of character distribution */
  entropy: number;
}

/**
 * Baseline state for drift detection.
 * Uses exponential moving average for stability.
 */
export interface BaselineState {
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Average tokens per second */
  avgTokensPerSecond: number;
  /** Average similarity score (0-1) */
  avgSimilarity: number;
  /** Baseline fingerprint for comparison */
  fingerprint: ResponseFingerprint | Record<string, never>;
  /** Number of samples used to build baseline */
  sampleCount: number;
}

/**
 * Overall health status of the LLM.
 * - stable: All metrics within normal range
 * - minor_variation: Small deviations, likely normal
 * - degraded: Notable issues, may affect quality
 * - unstable: Significant problems detected
 */
export type HealthStatus = 'stable' | 'minor_variation' | 'degraded' | 'unstable';

/**
 * Comprehensive health report from the monitoring system.
 */
export interface HealthReport {
  /** Overall health status */
  health: HealthStatus;
  /** Composite health score (0 = healthy, 1 = critical) */
  score: number;
  /** Individual engine results */
  engineResults: EngineResult[];
  /** Timestamp of this report */
  timestamp?: number;
  /** Recommendations based on current state */
  recommendations?: string[];
}

/**
 * Configuration for the monitorLLM wrapper.
 */
export interface MonitorConfig {
  /** Enable/disable specific engines */
  engines?: {
    latency?: boolean;
    tokenRate?: boolean;
    fingerprint?: boolean;
    structure?: boolean;
    consistency?: boolean;
  };
  /** Lifecycle hooks for health state changes */
  hooks?: {
    /** Called when health transitions to unstable */
    onUnstable?: (report: HealthReport) => void;
    /** Called when health transitions to degraded */
    onDegraded?: (report: HealthReport) => void;
    /** Called when health recovers to stable */
    onRecovery?: (report: HealthReport) => void;
    /** Called on every health check */
    onHealthCheck?: (report: HealthReport) => void;
  };
  /** Thresholds for status determination */
  thresholds?: {
    /** Latency ratio threshold for warning (default: 1.2) */
    latencyWarnRatio?: number;
    /** Latency ratio threshold for error (default: 3.0) */
    latencyErrorRatio?: number;
    /** Token rate ratio threshold for warning (default: 0.8) */
    tokenRateWarnRatio?: number;
    /** Token rate ratio threshold for error (default: 0.2) */
    tokenRateErrorRatio?: number;
  };
  /** Baseline learning rate (0-1, default: 0.1) */
  learningRate?: number;
  /** Minimum samples before baseline is considered stable */
  minSamplesForBaseline?: number;
}

/**
 * Sentinel test result for proactive LLM verification.
 */
export interface SentinelTestResult {
  /** Test name */
  test: string;
  /** Whether the test passed */
  passed: boolean;
  /** Detailed message */
  message: string;
  /** Test-specific details */
  details: Record<string, unknown>;
  /** Confidence in the result */
  confidence: number;
  /** Limitations of this test */
  limitations: string[];
}

/**
 * Configuration for sentinel tests.
 */
export interface SentinelConfig {
  /** LLM client to test */
  client: {
    generate: (opts: { prompt: string; model?: string }) => Promise<{ text: string; tokens?: number }>;
  };
  /** Model to use for tests */
  model?: string;
  /** Timeout for each test in milliseconds */
  timeout?: number;
  /** Number of retries on failure */
  retries?: number;
}
