/**
 * Risk Analyzer
 * 
 * Analyzes risk indicators for claims.
 * 
 * @module engines/hallucination/risk-analyzer
 * @author Haiec
 * @license MIT
 */

import { Claim } from '../../types/results';
import { Config } from '../../types/config';

/**
 * Analyze risk indicators for a claim
 */
export function analyzeRiskIndicators(claim: Claim, _config: Config): Claim {
  // Additional analysis can be added here for paid tiers
  // For free tier, we use the indicators already calculated during extraction
  
  return claim;
}

/**
 * Check for contradiction signals between claims
 */
export function checkContradictions(claims: Claim[]): Claim[] {
  const contradictionPairs: Array<[number, number]> = [];
  
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      if (detectContradiction(claims[i], claims[j])) {
        contradictionPairs.push([i, j]);
      }
    }
  }
  
  // Mark claims involved in contradictions
  const updatedClaims = claims.map((claim, index) => {
    const isInvolved = contradictionPairs.some(
      ([a, b]) => a === index || b === index
    );
    
    if (isInvolved) {
      return {
        ...claim,
        riskIndicators: {
          ...claim.riskIndicators,
          contradictionSignal: true
        }
      };
    }
    
    return claim;
  });
  
  return updatedClaims;
}

/**
 * Detect potential contradiction between two claims
 */
function detectContradiction(claim1: Claim, claim2: Claim): boolean {
  const text1 = claim1.text.toLowerCase();
  const text2 = claim2.text.toLowerCase();
  
  // Check for negation patterns
  const negationPatterns = [
    { positive: /\bis\b/, negative: /\bis not\b|\bisn't\b/ },
    { positive: /\bwill\b/, negative: /\bwill not\b|\bwon't\b/ },
    { positive: /\bcan\b/, negative: /\bcannot\b|\bcan't\b/ },
    { positive: /\bdoes\b/, negative: /\bdoes not\b|\bdoesn't\b/ },
    { positive: /\bhas\b/, negative: /\bhas not\b|\bhasn't\b/ },
    { positive: /\btrue\b/, negative: /\bfalse\b/ },
    { positive: /\byes\b/, negative: /\bno\b/ },
    { positive: /\balways\b/, negative: /\bnever\b/ },
    { positive: /\ball\b/, negative: /\bnone\b/ }
  ];
  
  for (const pattern of negationPatterns) {
    const match1Pos = pattern.positive.test(text1);
    const match1Neg = pattern.negative.test(text1);
    const match2Pos = pattern.positive.test(text2);
    const match2Neg = pattern.negative.test(text2);
    
    // One has positive, other has negative
    if ((match1Pos && match2Neg) || (match1Neg && match2Pos)) {
      // Check if they're about the same subject (simple overlap check)
      const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 4));
      const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 4));
      
      const overlap = [...words1].filter(w => words2.has(w));
      
      if (overlap.length >= 2) {
        return true;
      }
    }
  }
  
  return false;
}
