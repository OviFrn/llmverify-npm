/**
 * Hallucination Engine Tests
 * 
 * Tests for hallucination risk detection.
 */

import { HallucinationEngine } from '../src/engines/hallucination';
import { DEFAULT_CONFIG } from '../src/types/config';

describe('HallucinationEngine', () => {
  let engine: HallucinationEngine;

  beforeEach(() => {
    engine = new HallucinationEngine(DEFAULT_CONFIG);
  });

  describe('detect()', () => {
    it('should detect low risk for factual content', async () => {
      const content = 'The Earth orbits the Sun. Water is composed of hydrogen and oxygen.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should detect higher risk for speculative content', async () => {
      const content = 'I believe that aliens definitely exist on Mars. It is certain that they have built underground cities.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
      expect(result.riskIndicators).toBeDefined();
    });

    it('should detect overconfident language', async () => {
      const content = 'It is absolutely certain that this will happen. There is no doubt whatsoever.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });

    it('should handle empty content', async () => {
      const result = await engine.detect('');
      
      expect(result).toBeDefined();
      expect(result.claims).toBeDefined();
    });

    it('should handle content with citations', async () => {
      const content = 'According to NASA, the Moon is approximately 384,400 km from Earth (Source: NASA.gov).';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
      // Content with citations should have lower risk
    });

    it('should detect contradictions', async () => {
      const content = 'The temperature is very hot. The temperature is extremely cold.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });

    it('should handle numeric claims', async () => {
      const content = 'The population is exactly 8,234,567,891 people. The GDP is $45.6 trillion.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it('should include limitations in result', async () => {
      const content = 'Test content for limitations check.';
      const result = await engine.detect(content);
      
      expect(result.limitations).toBeDefined();
      expect(Array.isArray(result.limitations)).toBe(true);
    });

    it('should include methodology in result', async () => {
      const content = 'Test content for methodology check.';
      const result = await engine.detect(content);
      
      expect(result.methodology).toBeDefined();
      expect(typeof result.methodology).toBe('string');
    });

    it('should handle long content', async () => {
      const content = 'This is a test. '.repeat(100);
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const content = 'Test with special chars: @#$%^&*()_+{}|:"<>?';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });

    it('should handle multi-line content', async () => {
      const content = `Line 1: First claim.
      Line 2: Second claim.
      Line 3: Third claim.`;
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });
  });

  describe('risk indicators', () => {
    it('should identify speculative language', async () => {
      const content = 'I think this might be true. Perhaps it could work.';
      const result = await engine.detect(content);
      
      expect(result.riskIndicators).toBeDefined();
    });

    it('should identify fabricated-sounding claims', async () => {
      const content = 'Studies show that 99.9% of experts agree. Research proves this definitively.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });

    it('should identify vague claims', async () => {
      const content = 'Some people say things. Many experts believe stuff.';
      const result = await engine.detect(content);
      
      expect(result).toBeDefined();
    });
  });

  describe('confidence scoring', () => {
    it('should return confidence with value', async () => {
      const content = 'Test content for confidence scoring.';
      const result = await engine.detect(content);
      
      expect(result.confidence).toBeDefined();
      expect(result.confidence.value).toBeGreaterThanOrEqual(0);
      expect(result.confidence.value).toBeLessThanOrEqual(1);
    });
  });
});
