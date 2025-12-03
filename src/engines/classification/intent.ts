/**
 * Intent Detection Module
 * 
 * Detects the primary intent/purpose of LLM output.
 * 
 * @module engines/classification/intent
 * @author Haiec
 * @license MIT
 */

import { IntentTag, IntentCandidate } from './types';
import { countBullets, tokenize } from './utils';

/**
 * Intent detection patterns.
 */
const INTENT_PATTERNS: Array<{
  tag: IntentTag;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    tag: 'summary',
    patterns: [
      /\b(in summary|to summarize|overall|in conclusion|key points?|main points?)\b/i,
      /\b(tldr|tl;dr|brief overview)\b/i
    ],
    weight: 1.0
  },
  {
    tag: 'explanation',
    patterns: [
      /\b(because|therefore|this means|in other words|for example|such as)\b/i,
      /\b(the reason|explains?|due to|as a result)\b/i,
      /\b(works by|functions by|operates by)\b/i
    ],
    weight: 0.8
  },
  {
    tag: 'code',
    patterns: [
      /```[\s\S]*```/,
      /\b(function|const|let|var|class|import|export|return|if|else|for|while)\b/,
      /[{}\[\]();]=>/,
      /\b(def|async|await|try|catch)\b/
    ],
    weight: 1.0
  },
  {
    tag: 'list',
    patterns: [
      /^[-*•]\s+/m,
      /^\d+[.)]\s+/m,
      /\b(here are|the following|steps?:|items?:)\b/i
    ],
    weight: 0.9
  },
  {
    tag: 'question',
    patterns: [
      /\?$/m,
      /\b(what|why|how|when|where|who|which|would you|could you|can you)\b/i
    ],
    weight: 0.7
  },
  {
    tag: 'instruction',
    patterns: [
      /\b(step \d|first,?|then,?|next,?|finally,?|make sure|ensure|remember to)\b/i,
      /\b(you should|you need to|you must|please|do not|don't)\b/i
    ],
    weight: 0.8
  },
  {
    tag: 'creative',
    patterns: [
      /\b(once upon|imagine|picture this|in a world)\b/i,
      /\b(poem|story|tale|narrative|fiction)\b/i
    ],
    weight: 0.9
  },
  {
    tag: 'analysis',
    patterns: [
      /\b(analysis|analyzing|examine|examining|evaluate|evaluating)\b/i,
      /\b(pros and cons|advantages|disadvantages|strengths|weaknesses)\b/i,
      /\b(factors|considerations|implications)\b/i
    ],
    weight: 0.8
  },
  {
    tag: 'comparison',
    patterns: [
      /\b(compared to|versus|vs\.?|differ|difference|similar|unlike|whereas)\b/i,
      /\b(on the other hand|in contrast|alternatively)\b/i
    ],
    weight: 0.9
  },
  {
    tag: 'definition',
    patterns: [
      /\b(is defined as|refers to|means|is a|are a)\b/i,
      /\b(definition|meaning|concept of)\b/i
    ],
    weight: 0.7
  },
  {
    tag: 'translation',
    patterns: [
      /\b(translates? to|in [a-z]+ language|translation)\b/i
    ],
    weight: 1.0
  },
  {
    tag: 'conversation',
    patterns: [
      /\b(hi|hello|hey|thanks|thank you|you're welcome|sure|okay|ok)\b/i,
      /\b(I think|I believe|in my opinion|personally)\b/i
    ],
    weight: 0.5
  },
  {
    tag: 'data',
    patterns: [
      /\b(data|dataset|statistics|numbers|figures|metrics)\b/i,
      /\d+%|\d+\.\d+/,
      /\b(table|chart|graph)\b/i
    ],
    weight: 0.7
  }
];

/**
 * Detects intent candidates from text.
 * 
 * @param text - The text to analyze
 * @returns Array of intent candidates sorted by confidence
 */
export function detectIntent(text: string): IntentCandidate[] {
  const candidates: IntentCandidate[] = [];
  const words = tokenize(text);
  const bullets = countBullets(text);
  
  for (const { tag, patterns, weight } of INTENT_PATTERNS) {
    let matchCount = 0;
    const signals: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchCount++;
        signals.push(pattern.source.substring(0, 30));
      }
    }
    
    if (matchCount > 0) {
      // Calculate confidence based on matches and text characteristics
      let confidence = (matchCount / patterns.length) * weight;
      
      // Boost for structural matches
      if (tag === 'list' && bullets >= 3) {
        confidence = Math.min(1, confidence + 0.3);
      }
      if (tag === 'code' && text.includes('```')) {
        confidence = Math.min(1, confidence + 0.4);
      }
      
      // Normalize by text length (longer text = more reliable)
      if (words.length < 20) {
        confidence *= 0.7;
      } else if (words.length > 100) {
        confidence = Math.min(1, confidence * 1.1);
      }
      
      candidates.push({
        tag,
        confidence: Math.round(confidence * 100) / 100,
        signals
      });
    }
  }
  
  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  // If no candidates, return unknown
  if (candidates.length === 0) {
    candidates.push({
      tag: 'unknown',
      confidence: 0.5,
      signals: ['no_patterns_matched']
    });
  }
  
  return candidates;
}

/**
 * Gets the primary intent from candidates.
 */
export function getPrimaryIntent(candidates: IntentCandidate[]): IntentTag | null {
  if (candidates.length === 0) return null;
  
  const top = candidates[0];
  // Only return if confidence is reasonable
  if (top.confidence >= 0.3) {
    return top.tag;
  }
  
  return null;
}
