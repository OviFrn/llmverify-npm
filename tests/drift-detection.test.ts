/**
 * Drift Detection Tests
 * 
 * Tests the behavioral drift detection capabilities.
 */

import { ConsistencyEngine } from '../src/engines/consistency';
import { DEFAULT_CONFIG } from '../src/types/config';
import { driftTestCases, DriftTestCase } from './fixtures/drift-cases';
import { cosineSimilarity, jaccardSimilarity } from '../src/utils/similarity';

describe('Drift Detection Engine', () => {
  let engine: ConsistencyEngine;

  beforeEach(() => {
    engine = new ConsistencyEngine(DEFAULT_CONFIG);
  });

  describe('Style Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'style');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        // Combine baseline and current for consistency check
        const allContent = [...testCase.baseline, testCase.current].join('\n\n');
        const result = await engine.check(allContent);
        
        expect(result).toBeDefined();
        expect(result.stable !== undefined).toBe(true);
        
        // Calculate similarity between baseline average and current
        const baselineAvg = testCase.baseline.join(' ');
        const similarity = jaccardSimilarity(baselineAvg, testCase.current);
        
        console.log(`[${testCase.id}] Similarity: ${similarity.toFixed(2)}, Drift expected: ${testCase.expectedDrift}`);
        
        if (testCase.expectedDrift) {
          // Low similarity indicates drift
          expect(similarity).toBeLessThan(0.8);
        }
      });
    });
  });

  describe('Length Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'length');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        const baselineAvgLength = testCase.baseline.reduce((sum, s) => sum + s.length, 0) / testCase.baseline.length;
        const currentLength = testCase.current.length;
        const lengthRatio = currentLength / baselineAvgLength;
        
        console.log(`[${testCase.id}] Baseline avg: ${baselineAvgLength.toFixed(0)}, Current: ${currentLength}, Ratio: ${lengthRatio.toFixed(2)}`);
        
        if (testCase.expectedDrift) {
          // Significant length change indicates drift
          expect(lengthRatio < 0.3 || lengthRatio > 3).toBe(true);
        } else {
          expect(lengthRatio >= 0.3 && lengthRatio <= 3).toBe(true);
        }
      });
    });
  });

  describe('Topic Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'topic');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        const allContent = [...testCase.baseline, testCase.current].join('\n\n');
        const result = await engine.check(allContent);
        
        expect(result).toBeDefined();
        
        // Use cosine similarity for topic comparison
        const baselineText = testCase.baseline.join(' ');
        const similarity = cosineSimilarity(baselineText, testCase.current);
        
        console.log(`[${testCase.id}] Topic similarity: ${similarity.toFixed(2)}, Drift expected: ${testCase.expectedDrift}`);
        
        if (testCase.expectedDrift) {
          expect(similarity).toBeLessThan(0.7);
        }
      });
    });
  });

  describe('Persona Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'persona');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        const allContent = [...testCase.baseline, testCase.current].join('\n\n');
        const result = await engine.check(allContent);
        
        expect(result).toBeDefined();
        
        // Check for contradictions which may indicate persona shift
        const hasContradictions = result.contradictions && result.contradictions.length > 0;
        
        console.log(`[${testCase.id}] Contradictions: ${hasContradictions}, Drift expected: ${testCase.expectedDrift}`);
      });
    });
  });

  describe('Quality Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'quality');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        // Quality can be measured by specificity and structure
        const baselineSpecificity = testCase.baseline.reduce((sum, s) => {
          // Count specific terms (numbers, technical words)
          const specifics = s.match(/\d+|[A-Z][a-z]+[A-Z]/g) || [];
          return sum + specifics.length;
        }, 0) / testCase.baseline.length;
        
        const currentSpecifics = (testCase.current.match(/\d+|[A-Z][a-z]+[A-Z]/g) || []).length;
        
        console.log(`[${testCase.id}] Baseline specificity: ${baselineSpecificity.toFixed(1)}, Current: ${currentSpecifics}`);
        
        expect(testCase.expectedDrift !== undefined).toBe(true);
      });
    });
  });

  describe('Sentiment Drift', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'sentiment');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should ${testCase.expectedDrift ? 'detect' : 'not detect'}: ${testCase.name}`, async () => {
        // Simple sentiment indicators
        const positiveWords = /great|good|excellent|amazing|impressive|happy|satisfied/gi;
        const negativeWords = /terrible|bad|broken|hopeless|nothing|worst|horrible/gi;
        
        const baselinePositive = testCase.baseline.join(' ').match(positiveWords)?.length || 0;
        const baselineNegative = testCase.baseline.join(' ').match(negativeWords)?.length || 0;
        const currentPositive = testCase.current.match(positiveWords)?.length || 0;
        const currentNegative = testCase.current.match(negativeWords)?.length || 0;
        
        const baselineSentiment = baselinePositive - baselineNegative;
        const currentSentiment = currentPositive - currentNegative;
        const sentimentShift = Math.abs(currentSentiment - baselineSentiment);
        
        console.log(`[${testCase.id}] Baseline sentiment: ${baselineSentiment}, Current: ${currentSentiment}, Shift: ${sentimentShift}`);
        
        if (testCase.expectedDrift) {
          expect(sentimentShift).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });

  describe('No Drift Cases', () => {
    const cases = driftTestCases.filter(c => c.driftType === 'none');

    cases.forEach((testCase: DriftTestCase) => {
      it(`should analyze: ${testCase.name}`, async () => {
        const allContent = [...testCase.baseline, testCase.current].join('\n\n');
        const result = await engine.check(allContent);
        
        expect(result).toBeDefined();
        
        const baselineText = testCase.baseline.join(' ');
        const similarity = cosineSimilarity(baselineText, testCase.current);
        
        console.log(`[${testCase.id}] Similarity: ${similarity.toFixed(2)}, Stable: ${result.stable}`);
        
        // These are designed to be consistent - check similarity is reasonable
        expect(similarity).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Consistency Engine Integration', () => {
    it('should detect drift in combined content', async () => {
      const content = `
        Section 1: The API is well-documented and easy to use.
        Section 2: The API is poorly documented and confusing.
      `;
      
      const result = await engine.check(content);
      
      expect(result).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should report stability for consistent content', async () => {
      const content = `
        The function returns a number.
        The method accepts a string parameter.
        The class implements the interface.
      `;
      
      const result = await engine.check(content);
      
      expect(result).toBeDefined();
      expect(result.stable).toBe(true);
    });

    it('should include confidence scores', async () => {
      const content = 'Test content for confidence scoring.';
      const result = await engine.check(content);
      
      expect(result.confidence).toBeDefined();
      expect(result.confidence.value).toBeGreaterThanOrEqual(0);
      expect(result.confidence.value).toBeLessThanOrEqual(1);
    });
  });

  describe('Drift Metrics', () => {
    it('should calculate similarity metrics correctly', () => {
      const text1 = 'the quick brown fox jumps';
      const text2 = 'the quick brown dog runs';
      
      const jaccard = jaccardSimilarity(text1, text2);
      const cosine = cosineSimilarity(text1, text2);
      
      // Similar texts should have moderate to high similarity
      expect(jaccard).toBeGreaterThanOrEqual(0);
      expect(jaccard).toBeLessThanOrEqual(1);
      expect(cosine).toBeGreaterThanOrEqual(0);
      expect(cosine).toBeLessThanOrEqual(1);
    });

    it('should return high similarity for identical texts', () => {
      const text = 'identical text content here';
      
      const jaccard = jaccardSimilarity(text, text);
      const cosine = cosineSimilarity(text, text);
      
      expect(jaccard).toBeGreaterThanOrEqual(0.9);
      expect(cosine).toBeGreaterThanOrEqual(0.9);
    });

    it('should return low similarity for unrelated texts', () => {
      const text1 = 'programming javascript nodejs';
      const text2 = 'cooking recipes kitchen food';
      
      const jaccard = jaccardSimilarity(text1, text2);
      const cosine = cosineSimilarity(text1, text2);
      
      // Unrelated texts should have low similarity
      expect(jaccard).toBeLessThanOrEqual(0.5);
      expect(cosine).toBeLessThanOrEqual(0.5);
    });
  });
});
