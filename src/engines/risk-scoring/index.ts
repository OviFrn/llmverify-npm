/**
 * Risk Scoring Engine
 * 
 * Calculates overall risk score with honest interpretation.
 * 
 * @module engines/risk-scoring
 * @author Haiec
 * @license MIT
 */

import { Config } from '../../types/config';
import { VerifyResult, RiskScore, ConfidenceScore } from '../../types/results';

export class RiskScoringEngine {
  constructor(private _config: Config) {}
  
  calculate(result: Partial<VerifyResult>): RiskScore {
    const components = {
      hallucination: result.hallucination?.riskScore || 0,
      consistency: this.calculateConsistencyRisk(result.consistency),
      csm6: result.csm6?.riskScore || 0,
      json: result.json ? (result.json.valid ? 0 : 0.8) : undefined
    };
    
    const weights = this.getWeights();
    let overall = (
      components.hallucination * weights.hallucination +
      components.consistency * weights.consistency +
      components.csm6 * weights.csm6
    );
    
    if (components.json !== undefined) {
      overall = overall * 0.9 + components.json * 0.1;
    }
    
    const level = this.determineLevel(overall, result);
    const blockers = this.identifyBlockers(result);
    const action = this.determineAction(level, blockers);
    const confidence = this.calculateConfidence(result);
    const interpretation = this.generateInterpretation(level, components, blockers);
    
    return {
      overall,
      level,
      components,
      blockers,
      action,
      confidence,
      interpretation
    };
  }
  
  private getWeights() {
    return {
      hallucination: 0.35,
      consistency: 0.15,
      csm6: 0.50
    };
  }
  
  private calculateConsistencyRisk(consistency: VerifyResult['consistency']): number {
    if (!consistency) return 0;
    
    if (consistency.drift) return 0.8;
    if (!consistency.stable) return 0.6;
    if (consistency.contradictions.length > 0) return 0.5;
    
    return 1 - consistency.avgSimilarity;
  }
  
  private determineLevel(
    score: number, 
    result: Partial<VerifyResult>
  ): RiskScore['level'] {
    if (result.csm6?.findings.some(f => f.severity === 'critical')) {
      return 'critical';
    }
    
    if (score >= 0.75) return 'critical';
    if (score >= 0.50) return 'high';
    if (score >= 0.25) return 'moderate';
    return 'low';
  }
  
  private identifyBlockers(result: Partial<VerifyResult>): string[] {
    const blockers: string[] = [];
    
    if (result.csm6) {
      const criticalFindings = result.csm6.findings.filter(
        f => f.severity === 'critical'
      );
      blockers.push(...criticalFindings.map(f => f.id));
    }
    
    if (result.hallucination && result.hallucination.riskScore > 0.8) {
      blockers.push('HIGH_HALLUCINATION_RISK');
    }
    
    if (result.json && !result.json.valid) {
      blockers.push('INVALID_JSON');
    }
    
    if (result.consistency && result.consistency.contradictions.length > 5) {
      blockers.push('SEVERE_CONTRADICTIONS');
    }
    
    return blockers;
  }
  
  private determineAction(
    level: RiskScore['level'],
    blockers: string[]
  ): RiskScore['action'] {
    if (blockers.length > 0 || level === 'critical') return 'block';
    if (level === 'high') return 'review';
    return 'allow';
  }
  
  private calculateConfidence(result: Partial<VerifyResult>): ConfidenceScore {
    const enginesRan = [
      result.hallucination,
      result.consistency,
      result.csm6
    ].filter(Boolean).length;
    
    const value = Math.min(enginesRan / 3, 1.0);
    const margin = 0.15 * (1 - value);
    
    return {
      value: Math.max(0.4, value),
      interval: [
        Math.max(0, value - margin),
        Math.min(1, value + margin)
      ],
      method: 'heuristic'
    };
  }
  
  private generateInterpretation(
    level: RiskScore['level'],
    components: RiskScore['components'],
    blockers: string[]
  ): string {
    const interpretations = {
      low: 'Content appears safe for use. Standard human review recommended.',
      moderate: 'Some risk indicators detected. Human review recommended before use.',
      high: 'Multiple risk indicators detected. Detailed human review required before use.',
      critical: 'Critical risks detected. Do not use without addressing flagged issues.'
    };
    
    let interpretation = interpretations[level];
    
    if (blockers.length > 0) {
      interpretation += ` Blockers: ${blockers.join(', ')}.`;
    }
    
    if (components.hallucination > 0.6) {
      interpretation += ' High uncertainty in factual claims - verify with authoritative sources.';
    }
    
    if (components.csm6 > 0.6) {
      interpretation += ' Security or safety concerns detected - review CSM6 findings.';
    }
    
    return interpretation;
  }
}
