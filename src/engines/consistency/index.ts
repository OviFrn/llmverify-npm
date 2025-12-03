/**
 * Consistency Engine
 * 
 * Checks for internal consistency and contradictions.
 * 
 * @module engines/consistency
 * @author Haiec
 * @license MIT
 */

import { Config } from '../../types/config';
import { ConsistencyResult, Contradiction, ConfidenceScore } from '../../types/results';
import { splitParagraphs } from '../../utils/text';
import { combinedSimilarity } from '../../utils/similarity';

export class ConsistencyEngine {
  private readonly LIMITATIONS = [
    'Pattern-based consistency checking',
    'May miss subtle contradictions',
    'English language only',
    'Context-dependent accuracy',
    'Requires sufficient text length for meaningful analysis'
  ];
  
  private readonly METHODOLOGY = 
    'Analyzes text sections for internal consistency using similarity metrics ' +
    'and contradiction pattern detection. Identifies potential logical conflicts ' +
    'and semantic drift across sections.';
  
  constructor(private config: Config) {}
  
  async check(content: string): Promise<ConsistencyResult> {
    const sections = splitParagraphs(content);
    
    if (sections.length < 2) {
      return this.createMinimalResult(sections);
    }
    
    // Calculate similarity matrix
    const matrix = this.calculateSimilarityMatrix(sections);
    
    // Calculate average similarity
    const avgSimilarity = this.calculateAverageSimilarity(matrix);
    
    // Detect contradictions
    const contradictions = this.detectContradictions(sections);
    
    // Determine stability
    const stable = avgSimilarity > 0.7 && contradictions.length === 0;
    const drift = avgSimilarity < 0.5;
    
    // Calculate confidence
    const confidence = this.calculateConfidence(sections.length, contradictions.length);
    
    return {
      sections,
      avgSimilarity,
      similarityMatrix: this.config.output.verbose ? matrix : undefined,
      stable,
      drift,
      contradictions,
      confidence,
      limitations: this.LIMITATIONS,
      methodology: this.METHODOLOGY
    };
  }
  
  private createMinimalResult(sections: string[]): ConsistencyResult {
    return {
      sections,
      avgSimilarity: 1,
      stable: true,
      drift: false,
      contradictions: [],
      confidence: {
        value: 0.3,
        interval: [0.1, 0.5],
        method: 'heuristic'
      },
      limitations: [
        ...this.LIMITATIONS,
        'Insufficient text for meaningful consistency analysis'
      ],
      methodology: this.METHODOLOGY
    };
  }
  
  private calculateSimilarityMatrix(sections: string[]): number[][] {
    const n = sections.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (j > i) {
          const sim = combinedSimilarity(sections[i], sections[j]);
          matrix[i][j] = sim;
          matrix[j][i] = sim;
        }
      }
    }
    
    return matrix;
  }
  
  private calculateAverageSimilarity(matrix: number[][]): number {
    const n = matrix.length;
    if (n < 2) return 1;
    
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += matrix[i][j];
        count++;
      }
    }
    
    return count > 0 ? sum / count : 1;
  }
  
  private detectContradictions(sections: string[]): Contradiction[] {
    const contradictions: Contradiction[] = [];
    
    const contradictionPatterns = [
      { positive: /\bis\b/i, negative: /\bis not\b|\bisn't\b/i },
      { positive: /\bwill\b/i, negative: /\bwill not\b|\bwon't\b/i },
      { positive: /\btrue\b/i, negative: /\bfalse\b/i },
      { positive: /\balways\b/i, negative: /\bnever\b/i },
      { positive: /\ball\b/i, negative: /\bnone\b|\bno\b/i },
      { positive: /\bincreased?\b/i, negative: /\bdecreased?\b/i },
      { positive: /\bmore\b/i, negative: /\bless\b|\bfewer\b/i }
    ];
    
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const section1 = sections[i].toLowerCase();
        const section2 = sections[j].toLowerCase();
        
        for (const pattern of contradictionPatterns) {
          const s1HasPos = pattern.positive.test(section1);
          const s1HasNeg = pattern.negative.test(section1);
          const s2HasPos = pattern.positive.test(section2);
          const s2HasNeg = pattern.negative.test(section2);
          
          if ((s1HasPos && s2HasNeg) || (s1HasNeg && s2HasPos)) {
            // Check for subject overlap
            const words1 = new Set(section1.split(/\s+/).filter(w => w.length > 4));
            const words2 = new Set(section2.split(/\s+/).filter(w => w.length > 4));
            const overlap = [...words1].filter(w => words2.has(w));
            
            if (overlap.length >= 2) {
              contradictions.push({
                section1: i,
                section2: j,
                claim1: this.extractRelevantClaim(sections[i], pattern),
                claim2: this.extractRelevantClaim(sections[j], pattern),
                type: 'logical',
                confidence: 0.6 + (overlap.length * 0.05)
              });
              break;
            }
          }
        }
      }
    }
    
    return contradictions;
  }
  
  private extractRelevantClaim(section: string, _pattern: { positive: RegExp; negative: RegExp }): string {
    // Extract first sentence as representative claim
    const sentences = section.split(/[.!?]/);
    return sentences[0]?.trim().substring(0, 100) || section.substring(0, 100);
  }
  
  private calculateConfidence(sectionCount: number, contradictionCount: number): ConfidenceScore {
    let value = 0.5;
    
    // More sections = higher confidence
    if (sectionCount >= 5) value += 0.2;
    else if (sectionCount >= 3) value += 0.1;
    
    // Clear contradictions = higher confidence in result
    if (contradictionCount > 0) value += 0.1;
    
    const margin = 0.15;
    
    return {
      value: Math.min(0.85, value),
      interval: [Math.max(0, value - margin), Math.min(1, value + margin)],
      method: 'heuristic'
    };
  }
}
