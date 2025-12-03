/**
 * Hallucination Engine
 * 
 * Identifies risk indicators in AI outputs.
 * Does NOT definitively detect hallucinations - that requires ground truth.
 * 
 * @module engines/hallucination
 * @author Haiec
 * @license MIT
 */

import { Config } from '../../types/config';
import { HallucinationResult, Claim, ConfidenceScore } from '../../types/results';
import { extractClaims } from './claim-extractor';
import { analyzeRiskIndicators, checkContradictions } from './risk-analyzer';

export class HallucinationEngine {
  private readonly LIMITATIONS = [
    'Pattern-based detection only (free tier)',
    'Cannot verify factual accuracy without ground truth sources',
    'English language only',
    'Context-dependent false positives possible',
    'Novel phrasings may not be detected',
    'Requires human validation for production use'
  ];
  
  private readonly METHODOLOGY = 
    'Risk indicator identification using linguistic pattern analysis. ' +
    'Analyzes claim specificity, citation presence, language patterns, and ' +
    'contradiction signals. Does NOT verify factual accuracy. ' +
    'Results indicate likelihood that claims need human review.';
  
  constructor(private config: Config) {}
  
  async detect(content: string): Promise<HallucinationResult> {
    // Step 1: Extract claims
    let claims = extractClaims(content);
    
    // Step 2: Analyze risk indicators for each claim
    claims = claims.map(claim => 
      analyzeRiskIndicators(claim, this.config)
    );
    
    // Step 3: Check for contradictions
    claims = checkContradictions(claims);
    
    // Step 4: Identify suspicious claims
    const suspiciousClaims = claims.filter(claim => {
      const totalRisk = this.calculateClaimRisk(claim);
      return totalRisk > 0.5;
    });
    
    // Step 5: Calculate overall risk score
    const riskScore = this.calculateRiskScore(claims);
    
    // Step 6: Calculate risk indicators summary
    const riskIndicators = this.summarizeRiskIndicators(claims);
    
    // Step 7: Calculate confidence
    const confidence = this.calculateConfidence(claims);
    
    return {
      claims,
      suspiciousClaims,
      riskScore,
      confidence,
      riskIndicators,
      limitations: this.LIMITATIONS,
      methodology: this.METHODOLOGY
    };
  }
  
  private calculateClaimRisk(claim: Claim): number {
    return (
      claim.riskIndicators.lackOfSpecificity * 0.3 +
      (claim.riskIndicators.missingCitation ? 0.3 : 0) +
      (claim.riskIndicators.vagueLanguage ? 0.2 : 0) +
      (claim.riskIndicators.contradictionSignal ? 0.2 : 0)
    );
  }
  
  private calculateRiskScore(claims: Claim[]): number {
    if (claims.length === 0) return 0;
    
    const totalRisk = claims.reduce((sum, claim) => {
      return sum + this.calculateClaimRisk(claim);
    }, 0);
    
    return Math.min(totalRisk / claims.length, 1.0);
  }
  
  private summarizeRiskIndicators(claims: Claim[]) {
    if (claims.length === 0) {
      return {
        lackOfSpecificity: 0,
        missingCitations: 0,
        vagueLanguage: 0,
        contradictionSignals: 0
      };
    }
    
    return {
      lackOfSpecificity: claims.reduce((sum, c) => 
        sum + c.riskIndicators.lackOfSpecificity, 0) / claims.length,
      missingCitations: claims.filter(c => 
        c.riskIndicators.missingCitation).length,
      vagueLanguage: claims.filter(c => 
        c.riskIndicators.vagueLanguage).length,
      contradictionSignals: claims.filter(c => 
        c.riskIndicators.contradictionSignal).length
    };
  }
  
  private calculateConfidence(claims: Claim[]): ConfidenceScore {
    const sampleSize = claims.length;
    const baseLine = Math.min(sampleSize / 10, 1.0);
    
    const value = sampleSize < 3 ? baseLine * 0.5 : baseLine;
    const margin = 0.2 * (1 - value);
    
    return {
      value: Math.max(0.3, value),
      interval: [
        Math.max(0, value - margin),
        Math.min(1, value + margin)
      ],
      method: 'heuristic',
      factors: {
        patternStrength: value,
        contextClarity: value,
        historicalAccuracy: 0.7
      }
    };
  }
}
