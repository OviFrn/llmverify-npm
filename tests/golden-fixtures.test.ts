/**
 * Golden Fixture Tests
 * 
 * Tests with known inputs and expected outputs for each engine.
 * These serve as regression tests and documentation of expected behavior.
 * 
 * @module tests/golden-fixtures
 */

import {
  LatencyEngine,
  TokenRateEngine,
  FingerprintEngine,
  StructureEngine,
  HealthScoreEngine,
  classify,
  ClassificationEngine
} from '../src';

import type { CallRecord, BaselineState, EngineResult } from '../src';

// ============================================
// Golden Fixtures - Known Input/Output Pairs
// ============================================

describe('Golden Fixture Tests', () => {
  
  // ==========================================
  // LatencyEngine Golden Tests
  // ==========================================
  describe('LatencyEngine Golden Fixtures', () => {
    const baseline: BaselineState = {
      avgLatencyMs: 500,
      avgTokensPerSecond: 100,
      avgSimilarity: 0.85,
      fingerprint: { tokens: 50, sentences: 5, avgSentLength: 10, entropy: 4.0 },
      sampleCount: 10
    };

    it('GOLDEN: baseline 500ms, call 600ms → near 0 (ok)', () => {
      const call: CallRecord = {
        id: 'golden-1',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 10,
        latencyMs: 600 // 1.2x baseline
      };
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('ok');
      expect(result.value).toBe(0);
    });

    it('GOLDEN: baseline 500ms, call 1000ms → warn', () => {
      const call: CallRecord = {
        id: 'golden-2',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 10,
        latencyMs: 1000 // 2x baseline
      };
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('warn');
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(0.6);
    });

    it('GOLDEN: baseline 500ms, call 3000ms → error, near 1', () => {
      const call: CallRecord = {
        id: 'golden-3',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 10,
        latencyMs: 3000 // 6x baseline
      };
      
      const result = LatencyEngine(call, baseline);
      
      expect(result.status).toBe('error');
      expect(result.value).toBeGreaterThanOrEqual(0.6);
    });
  });

  // ==========================================
  // TokenRateEngine Golden Tests
  // ==========================================
  describe('TokenRateEngine Golden Fixtures', () => {
    const baseline: BaselineState = {
      avgLatencyMs: 1000,
      avgTokensPerSecond: 100, // 100 TPS baseline
      avgSimilarity: 0.85,
      fingerprint: { tokens: 50, sentences: 5, avgSentLength: 10, entropy: 4.0 },
      sampleCount: 10
    };

    it('GOLDEN: baseline 100 TPS, current 100 TPS → ok', () => {
      const call: CallRecord = {
        id: 'golden-tps-1',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 100,
        latencyMs: 1000 // 100 TPS
      };
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.status).toBe('ok');
      expect(result.value).toBeLessThan(0.3);
    });

    it('GOLDEN: baseline 100 TPS, current 50 TPS → warn', () => {
      const call: CallRecord = {
        id: 'golden-tps-2',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 50,
        latencyMs: 1000 // 50 TPS
      };
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.status).toBe('warn');
      expect(result.value).toBeGreaterThanOrEqual(0.3);
      expect(result.value).toBeLessThan(0.6);
    });

    it('GOLDEN: baseline 100 TPS, current 20 TPS → error', () => {
      const call: CallRecord = {
        id: 'golden-tps-3',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'response',
        responseTokens: 20,
        latencyMs: 1000 // 20 TPS
      };
      
      const result = TokenRateEngine(call, baseline);
      
      expect(result.status).toBe('error');
      expect(result.value).toBeGreaterThanOrEqual(0.6);
    });
  });

  // ==========================================
  // FingerprintEngine Golden Tests
  // ==========================================
  describe('FingerprintEngine Golden Fixtures', () => {
    it('GOLDEN: similar outputs → value ~= 0', () => {
      const baseline = {
        tokens: 50,
        sentences: 5,
        avgSentLength: 10,
        entropy: 4.0
      };
      
      const call: CallRecord = {
        id: 'golden-fp-1',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'This is a test response. It has multiple sentences. Each sentence is moderate length. The content is varied. This matches baseline.',
        responseTokens: 50,
        latencyMs: 1000
      };
      
      const result = FingerprintEngine(call, baseline);
      
      expect(result.status).toBe('ok');
      expect(result.value).toBeLessThan(0.3);
    });

    it('GOLDEN: radically shorter + lower entropy → high value', () => {
      const baseline = {
        tokens: 100,
        sentences: 10,
        avgSentLength: 10,
        entropy: 4.5
      };
      
      const call: CallRecord = {
        id: 'golden-fp-2',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: 'OK.', // Very short, low entropy
        responseTokens: 1,
        latencyMs: 100
      };
      
      const result = FingerprintEngine(call, baseline);
      
      expect(result.value).toBeGreaterThan(0.5);
    });
  });

  // ==========================================
  // StructureEngine Golden Tests
  // ==========================================
  describe('StructureEngine Golden Fixtures', () => {
    it('GOLDEN: valid JSON → isJson true, jsonValid true', () => {
      const call: CallRecord = {
        id: 'golden-struct-1',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: '{"status": "ok", "count": 42}',
        responseTokens: 10,
        latencyMs: 100
      };
      
      const result = StructureEngine(call);
      
      expect(result.details.isJson).toBe(true);
      expect(result.details.jsonValid).toBe(true);
    });

    it('GOLDEN: bullet list → listCount = 3', () => {
      const call: CallRecord = {
        id: 'golden-struct-2',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: '- Item one\n- Item two\n- Item three',
        responseTokens: 10,
        latencyMs: 100
      };
      
      const result = StructureEngine(call);
      
      expect(result.details.listCount).toBe(3);
    });

    it('GOLDEN: code block → codeBlockCount >= 1', () => {
      const call: CallRecord = {
        id: 'golden-struct-3',
        timestamp: Date.now(),
        prompt: 'test',
        model: 'gpt-4',
        responseText: '```python\nprint("hello")\n```',
        responseTokens: 10,
        latencyMs: 100
      };
      
      const result = StructureEngine(call);
      
      expect(result.details.codeBlockCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================
  // ClassificationEngine Golden Tests
  // ==========================================
  describe('ClassificationEngine Golden Fixtures', () => {
    it('GOLDEN: summary text → intent = summary', () => {
      const result = classify(
        'Summarize this article',
        'In summary, the key points are as follows. The main takeaway is that the article discusses important topics. To conclude, these are the essential findings.'
      );
      
      expect(result.intent).toBe('summary');
      expect(result.tags).toContain('intent:summary');
    });

    it('GOLDEN: code block → intent = code', () => {
      const result = classify(
        'Write a function',
        '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```'
      );
      
      const hasCodeIntent = result.intentCandidates.some(c => c.tag === 'code');
      expect(hasCodeIntent).toBe(true);
    });

    it('GOLDEN: bullet list → intent includes list', () => {
      const result = classify(
        'List the items',
        'Here are the items:\n- First item\n- Second item\n- Third item\n- Fourth item'
      );
      
      const hasListIntent = result.intentCandidates.some(c => c.tag === 'list');
      expect(hasListIntent).toBe(true);
      expect(result.isStructured).toBe(true);
    });

    it('GOLDEN: valid JSON → isJson = true', () => {
      const result = classify(
        'Return JSON',
        '{"name": "test", "value": 123, "active": true}'
      );
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual({ name: 'test', value: 123, active: true });
      expect(result.tags).toContain('output:json');
    });

    it('GOLDEN: schema rule with required keys → instructionFollowed', () => {
      const result = classify(
        'Return user data',
        '{"id": 1, "name": "John", "email": "john@example.com"}',
        {
          instructionRules: [
            { id: 'schema', type: 'schema', params: { requiredKeys: ['id', 'name'] } }
          ]
        }
      );
      
      expect(result.instructionFollowed).toBe(true);
      expect(result.instructionCompliance).toBe(1);
    });

    it('GOLDEN: compressed reasoning → high reasoningCompression', () => {
      const result = classify(
        'Explain step by step how photosynthesis works, including the light-dependent and light-independent reactions, and compare it to cellular respiration.',
        'Plants use sunlight to make food.'
      );
      
      expect(result.reasoningCompression).toBeGreaterThan(0.3);
      expect(result.details.compression.lengthDeficit).toBeGreaterThan(0.5);
    });

    it('GOLDEN: overconfident language → elevated hallucinationRisk', () => {
      const result = classify(
        'What is the weather?',
        'The weather will definitely be sunny tomorrow. This is absolutely certain and guaranteed. There is no doubt about it.'
      );
      
      expect(result.hallucinationRisk).toBeGreaterThan(0);
      expect(result.details.hallucination.overconfidentScore).toBeGreaterThan(0);
    });

    it('GOLDEN: speculative entities → elevated hallucinationRisk', () => {
      const result = classify(
        'Tell me about Python',
        'Python was created by Guido van Rossum. Dr. Smith from MIT and Professor Johnson from Stanford also contributed significantly to its development at the XYZ Research Institute.'
      );
      
      expect(result.details.hallucination.speculativeFactsScore).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // HealthScoreEngine Golden Tests
  // ==========================================
  describe('HealthScoreEngine Golden Fixtures', () => {
    it('GOLDEN: all ok → health = stable, score < 0.25', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 0, status: 'ok', details: {} },
        { metric: 'token_rate', value: 0, status: 'ok', details: {} },
        { metric: 'fingerprint', value: 0, status: 'ok', details: {} },
        { metric: 'structure', value: 0, status: 'ok', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(report.health).toBe('stable');
      expect(report.score).toBeLessThanOrEqual(0.25);
    });

    it('GOLDEN: mixed warnings → health = minor_variation or degraded', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 0.4, status: 'warn', details: {} },
        { metric: 'token_rate', value: 0.3, status: 'warn', details: {} },
        { metric: 'fingerprint', value: 0.2, status: 'ok', details: {} },
        { metric: 'structure', value: 0, status: 'ok', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(['minor_variation', 'degraded']).toContain(report.health);
      expect(report.score).toBeGreaterThan(0.1);
      expect(report.score).toBeLessThan(0.75);
    });

    it('GOLDEN: all errors → health = unstable, score > 0.75', () => {
      const results: EngineResult[] = [
        { metric: 'latency', value: 1, status: 'error', details: {} },
        { metric: 'token_rate', value: 1, status: 'error', details: {} },
        { metric: 'fingerprint', value: 1, status: 'error', details: {} },
        { metric: 'structure', value: 1, status: 'error', details: {} }
      ];
      
      const report = HealthScoreEngine(results);
      
      expect(report.health).toBe('unstable');
      expect(report.score).toBeGreaterThan(0.75);
    });
  });
});
