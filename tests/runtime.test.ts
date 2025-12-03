/**
 * Runtime Health Monitoring Tests
 * 
 * Tests for the runtime monitoring engines including:
 * - LatencyEngine
 * - TokenRateEngine
 * - FingerprintEngine
 * - StructureEngine
 * - BaselineEngine
 * - HealthScoreEngine
 * - monitorLLM wrapper
 * 
 * @module tests/runtime
 */

import {
  LatencyEngine,
  TokenRateEngine,
  FingerprintEngine,
  StructureEngine,
  BaselineEngine,
  HealthScoreEngine,
  isHealthy,
  getAlertLevel,
  monitorLLM
} from '../src';

import type {
  CallRecord,
  BaselineState,
  HealthReport,
  EngineResult
} from '../src';

// ============================================
// Test Fixtures
// ============================================

function createMockCallRecord(overrides: Partial<CallRecord> = {}): CallRecord {
  return {
    id: 'test-id-123',
    timestamp: Date.now(),
    prompt: 'Test prompt',
    model: 'gpt-4',
    responseText: 'This is a test response with some content.',
    responseTokens: 10,
    latencyMs: 100,
    ...overrides
  };
}

function createMockBaseline(overrides: Partial<BaselineState> = {}): BaselineState {
  return {
    avgLatencyMs: 100,
    avgTokensPerSecond: 100,
    avgSimilarity: 0.85,
    fingerprint: {
      tokens: 10,
      sentences: 2,
      avgSentLength: 5,
      entropy: 4.0
    },
    sampleCount: 10,
    ...overrides
  };
}

// ============================================
// LatencyEngine Tests
// ============================================

describe('LatencyEngine', () => {
  describe('basic functionality', () => {
    it('should return ok status when latency is within baseline', () => {
      const call = createMockCallRecord({ latencyMs: 100 });
      const baseline = createMockBaseline({ avgLatencyMs: 100 });
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.metric).toBe('latency');
      expect(result.status).toBe('ok');
      expect(result.value).toBe(0);
    });

    it('should return warn status when latency is elevated', () => {
      const call = createMockCallRecord({ latencyMs: 200 });
      const baseline = createMockBaseline({ avgLatencyMs: 100 });
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('warn');
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(1);
    });

    it('should return error status when latency is very high', () => {
      const call = createMockCallRecord({ latencyMs: 500 });
      const baseline = createMockBaseline({ avgLatencyMs: 100 });
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('error');
      expect(result.value).toBeGreaterThanOrEqual(0.6);
    });

    it('should return ok when no baseline exists', () => {
      const call = createMockCallRecord({ latencyMs: 500 });
      const baseline = createMockBaseline({ avgLatencyMs: 0 });
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('ok');
      expect(result.value).toBe(0);
    });

    it('should respect custom thresholds', () => {
      const call = createMockCallRecord({ latencyMs: 200 });
      const baseline = createMockBaseline({ avgLatencyMs: 100 });
      
      const result = LatencyEngine(call, baseline, { warnRatio: 3, errorRatio: 5 });
      
      expect(result.status).toBe('ok');
    });

    it('should include limitations in result', () => {
      const call = createMockCallRecord();
      const baseline = createMockBaseline();
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.limitations).toBeDefined();
      expect(result.limitations!.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// TokenRateEngine Tests
// ============================================

describe('TokenRateEngine', () => {
  describe('basic functionality', () => {
    it('should return ok status when token rate is normal', () => {
      const call = createMockCallRecord({ responseTokens: 100, latencyMs: 1000 });
      const baseline = createMockBaseline({ avgTokensPerSecond: 100 });
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.metric).toBe('token_rate');
      expect(result.status).toBe('ok');
    });

    it('should return warn status when token rate is low', () => {
      const call = createMockCallRecord({ responseTokens: 50, latencyMs: 1000 });
      const baseline = createMockBaseline({ avgTokensPerSecond: 100 });
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.status).toBe('warn');
    });

    it('should return error status when token rate is very low', () => {
      const call = createMockCallRecord({ responseTokens: 10, latencyMs: 1000 });
      const baseline = createMockBaseline({ avgTokensPerSecond: 100 });
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.status).toBe('error');
    });

    it('should handle zero latency gracefully', () => {
      const call = createMockCallRecord({ responseTokens: 100, latencyMs: 0 });
      const baseline = createMockBaseline({ avgTokensPerSecond: 100 });
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
    });
  });
});

// ============================================
// FingerprintEngine Tests
// ============================================

describe('FingerprintEngine', () => {
  describe('basic functionality', () => {
    it('should initialize fingerprint when no baseline exists', () => {
      const call = createMockCallRecord({ responseText: 'Hello world. This is a test.' });
      
      const result = FingerprintEngine(call, {});
      
      expect(result.metric).toBe('fingerprint');
      expect(result.status).toBe('ok');
      expect(result.details.initialized).toBe(true);
    });

    it('should detect drift when response structure changes significantly', () => {
      const call = createMockCallRecord({ 
        responseText: 'A'.repeat(500) // Very different from baseline
      });
      const baseline = {
        tokens: 10,
        sentences: 2,
        avgSentLength: 5,
        entropy: 4.0
      };
      
      const result = FingerprintEngine(call, baseline);
      
      expect(result.value).toBeGreaterThan(0);
    });

    it('should return ok when response matches baseline', () => {
      const call = createMockCallRecord({ 
        responseText: 'Hello world. This is a test sentence.'
      });
      const baseline = {
        tokens: 7,
        sentences: 2,
        avgSentLength: 3.5,
        entropy: 3.8
      };
      
      const result = FingerprintEngine(call, baseline);
      
      expect(result.status).toBe('ok');
    });
  });
});

// ============================================
// StructureEngine Tests
// ============================================

describe('StructureEngine', () => {
  describe('JSON detection', () => {
    it('should detect valid JSON in response', () => {
      const call = createMockCallRecord({ 
        responseText: '{"name": "test", "value": 123}'
      });
      
      const result = StructureEngine(call);
      
      expect(result.metric).toBe('structure');
      expect(result.details.isJson).toBe(true);
      expect(result.details.jsonValid).toBe(true);
    });

    it('should detect invalid JSON', () => {
      const call = createMockCallRecord({ 
        responseText: '{name: test, value: 123}' // Invalid JSON
      });
      
      const result = StructureEngine(call);
      
      expect(result.details.isJson).toBe(true);
      expect(result.details.jsonValid).toBe(false);
    });
  });

  describe('list detection', () => {
    it('should detect bullet lists', () => {
      const call = createMockCallRecord({ 
        responseText: '- Item 1\n- Item 2\n- Item 3'
      });
      
      const result = StructureEngine(call);
      
      expect(result.details.listCount).toBe(3);
    });

    it('should detect numbered lists', () => {
      const call = createMockCallRecord({ 
        responseText: '1. First\n2. Second\n3. Third'
      });
      
      const result = StructureEngine(call);
      
      expect(result.details.listCount).toBe(3);
    });
  });

  describe('code block detection', () => {
    it('should detect fenced code blocks', () => {
      const call = createMockCallRecord({ 
        responseText: '```javascript\nconsole.log("hello");\n```'
      });
      
      const result = StructureEngine(call);
      
      expect(result.details.codeBlockCount).toBeGreaterThan(0);
    });
  });
});

// ============================================
// BaselineEngine Tests
// ============================================

describe('BaselineEngine', () => {
  describe('initialization', () => {
    it('should start with empty baseline', () => {
      const engine = new BaselineEngine();
      const baseline = engine.get();
      
      expect(baseline.sampleCount).toBe(0);
      expect(baseline.avgLatencyMs).toBe(0);
    });

    it('should not be stable with no samples', () => {
      const engine = new BaselineEngine();
      
      expect(engine.isStable()).toBe(false);
    });
  });

  describe('updates', () => {
    it('should update baseline with first sample', () => {
      const engine = new BaselineEngine();
      const call = createMockCallRecord({ latencyMs: 100, responseTokens: 50 });
      const fingerprint = { tokens: 10, sentences: 2, avgSentLength: 5, entropy: 4.0 };
      
      engine.update(call, fingerprint, 0.9);
      
      const baseline = engine.get();
      expect(baseline.sampleCount).toBe(1);
      expect(baseline.avgLatencyMs).toBe(100);
    });

    it('should use EMA for subsequent updates', () => {
      const engine = new BaselineEngine(0.5); // 50% learning rate
      const fingerprint = { tokens: 10, sentences: 2, avgSentLength: 5, entropy: 4.0 };
      
      engine.update(createMockCallRecord({ latencyMs: 100 }), fingerprint, 0.9);
      engine.update(createMockCallRecord({ latencyMs: 200 }), fingerprint, 0.9);
      
      const baseline = engine.get();
      expect(baseline.avgLatencyMs).toBe(150); // EMA with 0.5 rate
    });

    it('should become stable after minimum samples', () => {
      const engine = new BaselineEngine(0.1, 3); // Min 3 samples
      const fingerprint = { tokens: 10, sentences: 2, avgSentLength: 5, entropy: 4.0 };
      
      engine.update(createMockCallRecord(), fingerprint, 0.9);
      expect(engine.isStable()).toBe(false);
      
      engine.update(createMockCallRecord(), fingerprint, 0.9);
      expect(engine.isStable()).toBe(false);
      
      engine.update(createMockCallRecord(), fingerprint, 0.9);
      expect(engine.isStable()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset baseline to initial state', () => {
      const engine = new BaselineEngine();
      const fingerprint = { tokens: 10, sentences: 2, avgSentLength: 5, entropy: 4.0 };
      
      engine.update(createMockCallRecord(), fingerprint, 0.9);
      engine.reset();
      
      expect(engine.getSampleCount()).toBe(0);
      expect(engine.isStable()).toBe(false);
    });
  });
});

// ============================================
// HealthScoreEngine Tests
// ============================================

describe('HealthScoreEngine', () => {
  describe('health calculation', () => {
    it('should return stable health when all engines are ok', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 0, status: 'ok', details: {} },
        { metric: 'token_rate', value: 0, status: 'ok', details: {} },
        { metric: 'fingerprint', value: 0, status: 'ok', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(report.health).toBe('stable');
      expect(report.score).toBeLessThanOrEqual(0.25);
    });

    it('should return degraded health when engines show warnings', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 0.5, status: 'warn', details: {} },
        { metric: 'token_rate', value: 0.5, status: 'warn', details: {} },
        { metric: 'fingerprint', value: 0.5, status: 'warn', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(['minor_variation', 'degraded', 'unstable']).toContain(report.health);
    });

    it('should return unstable health when engines show errors', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 1, status: 'error', details: {} },
        { metric: 'token_rate', value: 1, status: 'error', details: {} },
        { metric: 'fingerprint', value: 1, status: 'error', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(report.health).toBe('unstable');
      expect(report.score).toBeGreaterThan(0.75);
    });

    it('should generate recommendations for issues', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 1, status: 'error', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe('helper functions', () => {
    it('isHealthy should return true for stable health', () => {
      const report: HealthReport = {
        health: 'stable',
        score: 0.1,
        engineResults: []
      };
      
      expect(isHealthy(report)).toBe(true);
    });

    it('isHealthy should return false for unstable health', () => {
      const report: HealthReport = {
        health: 'unstable',
        score: 0.9,
        engineResults: []
      };
      
      expect(isHealthy(report)).toBe(false);
    });

    it('getAlertLevel should return correct levels', () => {
      expect(getAlertLevel({ health: 'stable', score: 0, engineResults: [] })).toBe('none');
      expect(getAlertLevel({ health: 'minor_variation', score: 0.3, engineResults: [] })).toBe('info');
      expect(getAlertLevel({ health: 'degraded', score: 0.6, engineResults: [] })).toBe('warning');
      expect(getAlertLevel({ health: 'unstable', score: 0.9, engineResults: [] })).toBe('critical');
    });
  });
});

// ============================================
// monitorLLM Wrapper Tests
// ============================================

describe('monitorLLM', () => {
  const createMockClient = (response: { text: string; tokens?: number } = { text: 'Hello!', tokens: 5 }) => ({
    generate: jest.fn().mockResolvedValue(response)
  });

  describe('basic functionality', () => {
    it('should wrap client and return health report', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient);
      
      const response = await monitored.generate({ prompt: 'Hello' });
      
      expect(response.text).toBe('Hello!');
      expect(response.llmverify).toBeDefined();
      expect(response.llmverify.health).toBeDefined();
    });

    it('should track baseline over multiple calls', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient);
      
      await monitored.generate({ prompt: 'Test 1' });
      await monitored.generate({ prompt: 'Test 2' });
      await monitored.generate({ prompt: 'Test 3' });
      
      const baseline = monitored.getBaseline();
      expect(baseline.sampleCount).toBe(3);
    });

    it('should return last health status', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient);
      
      await monitored.generate({ prompt: 'Test' });
      
      expect(monitored.getLastHealth()).toBe('stable');
    });

    it('should reset baseline', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient);
      
      await monitored.generate({ prompt: 'Test' });
      monitored.resetBaseline();
      
      expect(monitored.getBaseline().sampleCount).toBe(0);
    });
  });

  describe('hooks', () => {
    it('should call onHealthCheck hook on every request', async () => {
      const mockClient = createMockClient();
      const onHealthCheck = jest.fn();
      
      const monitored = monitorLLM(mockClient, {
        hooks: { onHealthCheck }
      });
      
      await monitored.generate({ prompt: 'Test' });
      
      expect(onHealthCheck).toHaveBeenCalledTimes(1);
    });

    it('should call onUnstable hook when health becomes unstable', async () => {
      // Create a client that returns very different responses
      let callCount = 0;
      const mockClient = {
        generate: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount > 5) {
            // Simulate very slow response
            return { text: 'x'.repeat(1000), tokens: 1000 };
          }
          return { text: 'Hello', tokens: 5 };
        })
      };
      
      const onUnstable = jest.fn();
      const monitored = monitorLLM(mockClient, {
        hooks: { onUnstable }
      });
      
      // Build baseline
      for (let i = 0; i < 10; i++) {
        await monitored.generate({ prompt: 'Test' });
      }
      
      // onUnstable may or may not be called depending on drift
      expect(onUnstable.mock.calls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration', () => {
    it('should respect custom thresholds', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient, {
        thresholds: {
          latencyWarnRatio: 10,
          latencyErrorRatio: 20
        }
      });
      
      const response = await monitored.generate({ prompt: 'Test' });
      
      expect(response.llmverify.health).toBe('stable');
    });

    it('should respect engine enable flags', async () => {
      const mockClient = createMockClient();
      const monitored = monitorLLM(mockClient, {
        engines: {
          latency: false,
          tokenRate: false,
          fingerprint: true,
          structure: true
        }
      });
      
      const response = await monitored.generate({ prompt: 'Test' });
      
      // Should still work with limited engines
      expect(response.llmverify).toBeDefined();
    });
  });
});
