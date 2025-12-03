/**
 * Engine Exports Tests
 * Ensures all engines are properly exported
 */

import {
  HallucinationEngine,
  ConsistencyEngine,
  JSONValidatorEngine,
  RiskScoringEngine,
  LatencyEngine,
  TokenRateEngine,
  FingerprintEngine,
  StructureEngine,
  BaselineEngine,
  HealthScoreEngine,
  isHealthy,
  getAlertLevel,
  ClassificationEngine,
  classify,
  detectIntent,
  detectAndRepairJson,
  evaluateInstructionRules,
  calculateHallucinationSignals,
  calculateHallucinationRisk,
  getHallucinationLabel,
  calculateCompressionMetrics,
  calculateCompressionScore,
  getReasoningLabel
} from '../src/engines';

describe('Engine Exports', () => {
  describe('Core Engines', () => {
    it('should export HallucinationEngine', () => {
      expect(HallucinationEngine).toBeDefined();
      expect(typeof HallucinationEngine).toBe('function');
    });

    it('should export ConsistencyEngine', () => {
      expect(ConsistencyEngine).toBeDefined();
      expect(typeof ConsistencyEngine).toBe('function');
    });

    it('should export JSONValidatorEngine', () => {
      expect(JSONValidatorEngine).toBeDefined();
      expect(typeof JSONValidatorEngine).toBe('function');
    });

    it('should export RiskScoringEngine', () => {
      expect(RiskScoringEngine).toBeDefined();
      expect(typeof RiskScoringEngine).toBe('function');
    });
  });

  describe('Runtime Engines', () => {
    it('should export LatencyEngine', () => {
      expect(LatencyEngine).toBeDefined();
      expect(typeof LatencyEngine).toBe('function');
    });

    it('should export TokenRateEngine', () => {
      expect(TokenRateEngine).toBeDefined();
      expect(typeof TokenRateEngine).toBe('function');
    });

    it('should export FingerprintEngine', () => {
      expect(FingerprintEngine).toBeDefined();
      expect(typeof FingerprintEngine).toBe('function');
    });

    it('should export StructureEngine', () => {
      expect(StructureEngine).toBeDefined();
      expect(typeof StructureEngine).toBe('function');
    });

    it('should export BaselineEngine', () => {
      expect(BaselineEngine).toBeDefined();
      expect(typeof BaselineEngine).toBe('function');
    });

    it('should export HealthScoreEngine', () => {
      expect(HealthScoreEngine).toBeDefined();
      expect(typeof HealthScoreEngine).toBe('function');
    });

    it('should export isHealthy function', () => {
      expect(isHealthy).toBeDefined();
      expect(typeof isHealthy).toBe('function');
    });

    it('should export getAlertLevel function', () => {
      expect(getAlertLevel).toBeDefined();
      expect(typeof getAlertLevel).toBe('function');
    });
  });

  describe('Classification Functions', () => {
    it('should export ClassificationEngine', () => {
      expect(ClassificationEngine).toBeDefined();
      expect(typeof ClassificationEngine).toBe('function');
    });

    it('should export classify function', () => {
      expect(classify).toBeDefined();
      expect(typeof classify).toBe('function');
    });

    it('should export detectIntent function', () => {
      expect(detectIntent).toBeDefined();
      expect(typeof detectIntent).toBe('function');
    });

    it('should export detectAndRepairJson function', () => {
      expect(detectAndRepairJson).toBeDefined();
      expect(typeof detectAndRepairJson).toBe('function');
    });

    it('should export evaluateInstructionRules function', () => {
      expect(evaluateInstructionRules).toBeDefined();
      expect(typeof evaluateInstructionRules).toBe('function');
    });

    it('should export hallucination functions', () => {
      expect(calculateHallucinationSignals).toBeDefined();
      expect(calculateHallucinationRisk).toBeDefined();
      expect(getHallucinationLabel).toBeDefined();
    });

    it('should export compression functions', () => {
      expect(calculateCompressionMetrics).toBeDefined();
      expect(calculateCompressionScore).toBeDefined();
      expect(getReasoningLabel).toBeDefined();
    });
  });
});
