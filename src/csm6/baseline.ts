/**
 * CSM6 Baseline Engine
 * 
 * Cognitive System Management v6 - Baseline Profile
 * Implements security, privacy, and safety checks.
 * 
 * @module csm6/baseline
 * @author Haiec
 * @license MIT
 */

import { Config } from '../types/config';
import { CSM6Result, Finding, Severity, Category } from '../types/results';
import { checkPromptInjection, checkPII, checkHarmfulContent } from './security';

export class CSM6Baseline {
  private readonly LIMITATIONS = [
    'Pattern-based detection (free tier)',
    'English language only',
    'Cannot detect novel attack patterns',
    'Context-dependent false positives possible',
    'Requires human validation for production use'
  ];
  
  private readonly METHODOLOGY = 
    'CSM6 Baseline Profile: Implements OWASP LLM Top 10 aligned checks ' +
    'for security (prompt injection), privacy (PII detection), and ' +
    'safety (harmful content). Pattern-based detection with confidence intervals.';
  
  constructor(private config: Config) {}
  
  async audit(input: string, output: string): Promise<CSM6Result> {
    const findings: Finding[] = [];
    const checksPerformed: string[] = [];
    
    const csm6Config = this.config.engines.csm6;
    
    // Security checks
    if (csm6Config.checks.security) {
      checksPerformed.push('security:prompt-injection');
      const injectionFindings = checkPromptInjection(input);
      findings.push(...injectionFindings);
    }
    
    // Privacy checks
    if (csm6Config.checks.privacy) {
      checksPerformed.push('privacy:pii-detection');
      const piiFindings = checkPII(output);
      findings.push(...piiFindings);
    }
    
    // Safety checks
    if (csm6Config.checks.safety) {
      checksPerformed.push('safety:harmful-content');
      const harmFindings = checkHarmfulContent(output);
      findings.push(...harmFindings);
    }
    
    // Transparency (always enabled)
    checksPerformed.push('transparency:audit-trail');
    
    // Calculate summary
    const summary = this.calculateSummary(findings);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(findings);
    
    // Determine if passed
    const passed = !findings.some(f => 
      f.severity === 'critical' || f.severity === 'high'
    );
    
    return {
      findings,
      summary,
      riskScore,
      passed,
      profile: csm6Config.profile,
      checksPerformed,
      limitations: this.LIMITATIONS,
      methodology: this.METHODOLOGY
    };
  }
  
  private calculateSummary(findings: Finding[]): CSM6Result['summary'] {
    const bySeverity: Record<Severity, number> = {
      info: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    const byCategory: Record<Category, number> = {
      security: 0,
      privacy: 0,
      safety: 0,
      fairness: 0,
      reliability: 0,
      governance: 0
    };
    
    for (const finding of findings) {
      bySeverity[finding.severity]++;
      byCategory[finding.category]++;
    }
    
    return {
      total: findings.length,
      bySeverity,
      byCategory
    };
  }
  
  private calculateRiskScore(findings: Finding[]): number {
    if (findings.length === 0) return 0;
    
    const severityWeights: Record<Severity, number> = {
      info: 0.1,
      low: 0.2,
      medium: 0.4,
      high: 0.7,
      critical: 1.0
    };
    
    let totalWeight = 0;
    let maxWeight = 0;
    
    for (const finding of findings) {
      const weight = severityWeights[finding.severity] * finding.confidence.value;
      totalWeight += weight;
      maxWeight = Math.max(maxWeight, weight);
    }
    
    // Combine average and max for final score
    const avgWeight = totalWeight / findings.length;
    const score = avgWeight * 0.6 + maxWeight * 0.4;
    
    return Math.min(1, score);
  }
}
