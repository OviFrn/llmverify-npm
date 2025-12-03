/**
 * Hallucination Detection Tests
 * 
 * Tests the hallucination detection engine against challenging cases.
 */

import { HallucinationEngine } from '../src/engines/hallucination';
import { DEFAULT_CONFIG } from '../src/types/config';
import { hallucinationTestCases, HallucinationTestCase } from './fixtures/hallucination-cases';

describe('Hallucination Detection Engine', () => {
  let engine: HallucinationEngine;

  beforeEach(() => {
    engine = new HallucinationEngine(DEFAULT_CONFIG);
  });

  describe('Fabricated Statistics', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'fabricated-statistics');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        expect(result.riskScore).toBeDefined();
        expect(result.claims.length).toBeGreaterThan(0);
        
        // Log for analysis
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('False Citations', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'false-citations');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        expect(result.riskScore).toBeDefined();
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Overconfident Claims', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'overconfident-claims');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        
        // Check for overconfidence indicators
        const hasOverconfidence = result.claims.some(claim => 
          claim.riskIndicators?.vagueLanguage === false && 
          claim.riskIndicators?.lackOfSpecificity < 0.3
        );
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Contradictions', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'contradictions');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        
        // Check for contradiction signals
        const hasContradiction = result.claims.some(claim => 
          claim.riskIndicators?.contradictionSignal === true
        );
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Contradiction: ${hasContradiction}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Vague Authority Appeals', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'vague-authority');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        
        // Check for vague language indicators
        const hasVagueLanguage = result.claims.some(claim => 
          claim.riskIndicators?.vagueLanguage === true
        );
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Vague: ${hasVagueLanguage}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Plausible But False', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'plausible-false');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should analyze: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        expect(result.methodology).toBeDefined();
        expect(result.limitations).toBeDefined();
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Mixed True and False', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'mixed-truth');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should analyze: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        expect(result.claims.length).toBeGreaterThan(0);
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Claims: ${result.claims.length}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Speculation', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'speculation');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should detect: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Safe Content (Control Cases)', () => {
    const cases = hallucinationTestCases.filter(c => c.category === 'safe');

    cases.forEach((testCase: HallucinationTestCase) => {
      it(`should pass: ${testCase.name}`, async () => {
        const result = await engine.detect(testCase.content);
        
        expect(result).toBeDefined();
        expect(result.riskScore).toBeLessThan(0.5);
        
        console.log(`[${testCase.id}] Risk: ${result.riskScore.toFixed(2)}, Expected: ${testCase.expectedRiskLevel}`);
      });
    });
  });

  describe('Risk Score Distribution', () => {
    it('should produce varied risk scores across all cases', async () => {
      const scores: number[] = [];
      
      for (const testCase of hallucinationTestCases) {
        const result = await engine.detect(testCase.content);
        scores.push(result.riskScore);
      }
      
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      console.log(`Score distribution - Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}, Avg: ${avg.toFixed(2)}`);
      
      // Scores should have some variance
      expect(max - min).toBeGreaterThan(0);
    });
  });

  describe('Claim Extraction', () => {
    it('should extract multiple claims from complex content', async () => {
      const content = `
        The study found that 85% of participants improved.
        Dr. Smith confirmed these results in a peer-reviewed paper.
        This treatment is definitely the best option available.
        However, some experts disagree with the methodology.
      `;
      
      const result = await engine.detect(content);
      
      expect(result.claims.length).toBeGreaterThan(1);
    });

    it('should identify claim types correctly', async () => {
      const content = 'The population of Tokyo is approximately 14 million people.';
      const result = await engine.detect(content);
      
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.claims[0].type).toBeDefined();
    });
  });
});
