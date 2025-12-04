/**
 * Integration tests for v1.4.0 features
 */

import { verify } from '../src/verify';
import { getLogger, LogLevel } from '../src/logging/logger';
import { getBaselineStorage } from '../src/baseline/storage';
import { getPluginRegistry } from '../src/plugins/registry';
import { createPlugin, use } from '../src/plugins/api';
import { ErrorCode, getErrorMetadata } from '../src/errors/codes';
import { RateLimiter, sanitizeForLogging } from '../src/security/validators';

describe('v1.4.0 Features Integration', () => {
  describe('Error Handling', () => {
    it('should have all error codes defined', () => {
      expect(ErrorCode.INVALID_INPUT).toBeDefined();
      expect(ErrorCode.CONTENT_TOO_LARGE).toBeDefined();
      expect(ErrorCode.TIMEOUT).toBeDefined();
    });
    
    it('should provide error metadata', () => {
      const metadata = getErrorMetadata(ErrorCode.CONTENT_TOO_LARGE);
      
      expect(metadata.code).toBe(ErrorCode.CONTENT_TOO_LARGE);
      expect(metadata.severity).toBeDefined();
      expect(metadata.suggestion).toBeDefined();
      expect(metadata.recoverable).toBeDefined();
    });
  });
  
  describe('Logging System', () => {
    it('should create logger instance', () => {
      const logger = getLogger({ level: LogLevel.INFO });
      
      expect(logger).toBeDefined();
      expect(logger.startRequest).toBeDefined();
      expect(logger.info).toBeDefined();
    });
    
    it('should track request lifecycle', () => {
      const logger = getLogger();
      
      const requestId = logger.startRequest();
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      
      logger.info('Test message');
      
      const duration = logger.endRequest();
      expect(typeof duration).toBe('number');
    });
  });
  
  describe('Baseline Storage', () => {
    it('should create baseline storage', () => {
      const storage = getBaselineStorage();
      
      expect(storage).toBeDefined();
      expect(storage.updateBaseline).toBeDefined();
      expect(storage.checkDrift).toBeDefined();
    });
    
    it('should update baseline metrics', () => {
      const storage = getBaselineStorage();
      
      const baseline = storage.updateBaseline({
        latency: 100,
        contentLength: 500,
        riskScore: 0.3,
        riskLevel: 'low'
      });
      
      expect(baseline).toBeDefined();
      expect(baseline.sampleCount).toBeGreaterThan(0);
    });
    
    it('should detect drift', () => {
      const storage = getBaselineStorage();
      
      // Update baseline
      storage.updateBaseline({
        latency: 100,
        contentLength: 500,
        riskScore: 0.3,
        riskLevel: 'low'
      });
      
      // Check for drift with significantly different values
      const drifts = storage.checkDrift({
        latency: 200,
        riskScore: 0.8
      });
      
      expect(Array.isArray(drifts)).toBe(true);
    });
  });
  
  describe('Plugin System', () => {
    it('should create and register plugins', () => {
      const registry = getPluginRegistry();
      const initialCount = registry.count();
      
      const plugin = createPlugin({
        id: 'test-plugin-' + Date.now(),
        name: 'Test Plugin',
        category: 'custom',
        execute: async () => ({ findings: [], score: 0 })
      });
      
      use(plugin);
      
      expect(registry.count()).toBe(initialCount + 1);
    });
    
    it('should execute plugins', async () => {
      const registry = getPluginRegistry();
      
      const plugin = createPlugin({
        id: 'test-exec-' + Date.now(),
        name: 'Test Execution',
        category: 'custom',
        execute: async (context) => ({
          findings: [{ category: 'custom', severity: 'low', message: 'Test' }],
          score: 0.1
        })
      });
      
      use(plugin);
      
      const results = await registry.executeAll({
        content: 'test content',
        config: {}
      });
      
      expect(Array.isArray(results)).toBe(true);
    });
  });
  
  describe('Security Utilities', () => {
    it('should create rate limiter', () => {
      const limiter = new RateLimiter(5, 1000);
      
      expect(limiter).toBeDefined();
      expect(limiter.isAllowed('test-key')).toBe(true);
    });
    
    it('should enforce rate limits', () => {
      const limiter = new RateLimiter(2, 1000);
      const key = 'test-' + Date.now();
      
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false); // Third call blocked
    });
    
    it('should sanitize PII', () => {
      const text = 'Contact me at test@example.com or call 555-123-4567';
      const sanitized = sanitizeForLogging(text);
      
      expect(sanitized).toContain('[EMAIL]');
      expect(sanitized).toContain('[PHONE]');
      expect(sanitized).not.toContain('test@example.com');
      expect(sanitized).not.toContain('555-123-4567');
    });
  });
  
  describe('Full Verification with v1.4.0 Features', () => {
    it('should verify content with all features enabled', async () => {
      const result = await verify({
        content: 'This is a test AI response for verification.',
        config: { tier: 'free' }
      });
      
      expect(result).toBeDefined();
      expect(result.risk).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.version).toBeDefined();
    });
    
    it('should handle errors with error codes', async () => {
      try {
        await verify({
          content: '',
          config: { tier: 'free' }
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });
  });
});
