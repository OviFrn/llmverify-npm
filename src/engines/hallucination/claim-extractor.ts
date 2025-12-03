/**
 * Claim Extractor
 * 
 * Extracts claims from text for risk analysis.
 * 
 * @module engines/hallucination/claim-extractor
 * @author Haiec
 * @license MIT
 */

import { Claim, ConfidenceScore } from '../../types/results';
import { splitSentences } from '../../utils/text';

/**
 * Extract claims from text
 */
export function extractClaims(text: string): Claim[] {
  const sentences = splitSentences(text);
  const claims: Claim[] = [];
  
  let currentIndex = 0;
  
  for (const sentence of sentences) {
    const startIndex = text.indexOf(sentence, currentIndex);
    const endIndex = startIndex + sentence.length;
    
    const claim = analyzeSentence(sentence, startIndex, endIndex);
    if (claim) {
      claims.push(claim);
    }
    
    currentIndex = endIndex;
  }
  
  return claims;
}

/**
 * Analyze a sentence to determine if it's a claim
 */
function analyzeSentence(
  sentence: string, 
  start: number, 
  end: number
): Claim | null {
  const trimmed = sentence.trim();
  if (trimmed.length < 10) return null;
  
  const type = classifySentence(trimmed);
  const verifiable = isVerifiable(trimmed, type);
  
  const riskIndicators = {
    lackOfSpecificity: calculateSpecificityRisk(trimmed),
    missingCitation: checkMissingCitation(trimmed, type),
    vagueLanguage: checkVagueLanguage(trimmed),
    contradictionSignal: false // Set during consistency check
  };
  
  const confidence = calculateClaimConfidence(riskIndicators);
  
  return {
    text: trimmed,
    span: [start, end],
    type,
    verifiable,
    riskIndicators,
    confidence,
    limitations: [
      'Pattern-based claim extraction',
      'May miss implicit claims',
      'Context not fully analyzed'
    ]
  };
}

/**
 * Classify sentence type
 */
function classifySentence(
  sentence: string
): 'factual' | 'opinion' | 'instruction' | 'metadata' {
  const lower = sentence.toLowerCase();
  
  // Instructions
  if (/^(please|you should|you must|do not|don't|always|never)\b/i.test(lower)) {
    return 'instruction';
  }
  
  // Opinions
  if (/\b(i think|i believe|in my opinion|seems|appears|might|could|may)\b/i.test(lower)) {
    return 'opinion';
  }
  
  // Metadata
  if (/^(note:|warning:|important:|disclaimer:)/i.test(lower)) {
    return 'metadata';
  }
  
  // Default to factual
  return 'factual';
}

/**
 * Check if claim is verifiable
 */
function isVerifiable(sentence: string, type: string): boolean {
  if (type === 'opinion' || type === 'instruction') {
    return false;
  }
  
  // Contains numbers or dates
  if (/\d+/.test(sentence)) {
    return true;
  }
  
  // Contains proper nouns (capitalized words not at start)
  if (/\s[A-Z][a-z]+/.test(sentence)) {
    return true;
  }
  
  return true;
}

/**
 * Calculate specificity risk (0-1, higher = more risky)
 */
function calculateSpecificityRisk(sentence: string): number {
  let risk = 0.5; // Base risk
  
  // Reduce risk if contains specific numbers
  if (/\b\d+(\.\d+)?%?\b/.test(sentence)) {
    risk -= 0.2;
  }
  
  // Reduce risk if contains dates
  if (/\b(19|20)\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(sentence)) {
    risk -= 0.15;
  }
  
  // Reduce risk if contains proper nouns
  const properNouns = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
  if (properNouns.length > 1) {
    risk -= 0.1;
  }
  
  // Increase risk for vague quantifiers
  if (/\b(many|some|few|several|various|numerous|countless)\b/i.test(sentence)) {
    risk += 0.15;
  }
  
  // Increase risk for hedging language
  if (/\b(generally|usually|often|sometimes|typically)\b/i.test(sentence)) {
    risk += 0.1;
  }
  
  return Math.max(0, Math.min(1, risk));
}

/**
 * Check for missing citation
 */
function checkMissingCitation(sentence: string, type: string): boolean {
  if (type !== 'factual') return false;
  
  // Has citation markers
  if (/\[\d+\]|\(\d{4}\)|according to|source:|cited from/i.test(sentence)) {
    return false;
  }
  
  // Contains strong factual claims without citation
  const strongClaims = /\b(studies show|research indicates|scientists found|data shows|evidence suggests|proven|confirmed)\b/i;
  
  return strongClaims.test(sentence);
}

/**
 * Check for vague language
 */
function checkVagueLanguage(sentence: string): boolean {
  const vaguePatterns = [
    /\b(somehow|something|somewhere|someone|somewhat)\b/i,
    /\b(kind of|sort of|type of)\b/i,
    /\b(stuff|things|etc\.?)\b/i,
    /\b(basically|essentially|virtually)\b/i
  ];
  
  return vaguePatterns.some(p => p.test(sentence));
}

/**
 * Calculate confidence score for claim analysis
 */
function calculateClaimConfidence(riskIndicators: {
  lackOfSpecificity: number;
  missingCitation: boolean;
  vagueLanguage: boolean;
  contradictionSignal: boolean;
}): ConfidenceScore {
  // Base confidence for pattern-based analysis
  const baseConfidence = 0.65;
  
  // Adjust based on clarity of signals
  let adjustment = 0;
  
  if (riskIndicators.lackOfSpecificity > 0.7 || riskIndicators.lackOfSpecificity < 0.3) {
    adjustment += 0.1; // Clear signal
  }
  
  if (riskIndicators.missingCitation) {
    adjustment += 0.05;
  }
  
  const value = Math.min(0.85, baseConfidence + adjustment);
  const margin = 0.15;
  
  return {
    value,
    interval: [Math.max(0, value - margin), Math.min(1, value + margin)],
    method: 'heuristic',
    factors: {
      patternStrength: value,
      contextClarity: 0.6
    }
  };
}
