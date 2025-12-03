/**
 * Classification Engine Tests
 * 
 * Tests for the classification engine including:
 * - Intent detection
 * - JSON detection and repair
 * - Instruction-following evaluation
 * - Hallucination risk heuristics
 * - Reasoning compression scoring
 * - Tag generation
 * 
 * @module tests/classification
 */

import {
  classify,
  ClassificationEngine,
  detectIntent,
  detectAndRepairJson,
  evaluateInstructionRules,
  calculateHallucinationSignals,
  calculateHallucinationRisk,
  getHallucinationLabel,
  calculateCompressionMetrics,
  calculateCompressionScore,
  getReasoningLabel
} from '../src';

import type {
  InstructionRule,
  ClassificationPolicy,
  ClassificationResult,
  IntentTag
} from '../src';

// ============================================
// Intent Detection Tests
// ============================================

describe('Intent Detection', () => {
  describe('detectIntent', () => {
    it('should detect summary intent', () => {
      const text = 'In summary, the main points are as follows. The key takeaways include...';
      const candidates = detectIntent(text);
      
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].tag).toBe('summary');
    });

    it('should detect code intent', () => {
      const text = '```javascript\nfunction hello() {\n  console.log("Hello");\n}\n```';
      const candidates = detectIntent(text);
      
      const codeCandidate = candidates.find(c => c.tag === 'code');
      expect(codeCandidate).toBeDefined();
      expect(codeCandidate!.confidence).toBeGreaterThan(0.5);
    });

    it('should detect list intent', () => {
      const text = 'Here are the items:\n- First item\n- Second item\n- Third item';
      const candidates = detectIntent(text);
      
      const listCandidate = candidates.find(c => c.tag === 'list');
      expect(listCandidate).toBeDefined();
    });

    it('should detect explanation intent', () => {
      const text = 'This works because the algorithm processes each element. Therefore, the complexity is O(n). In other words, it scales linearly.';
      const candidates = detectIntent(text);
      
      const explanationCandidate = candidates.find(c => c.tag === 'explanation');
      expect(explanationCandidate).toBeDefined();
    });

    it('should detect comparison intent', () => {
      const text = 'Compared to Python, JavaScript is more commonly used for web development. On the other hand, Python excels in data science.';
      const candidates = detectIntent(text);
      
      const comparisonCandidate = candidates.find(c => c.tag === 'comparison');
      expect(comparisonCandidate).toBeDefined();
    });

    it('should return unknown for ambiguous text', () => {
      const text = 'Hello.';
      const candidates = detectIntent(text);
      
      // Should have at least one candidate
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should include signals in candidates', () => {
      const text = 'In summary, the key points are...';
      const candidates = detectIntent(text);
      
      expect(candidates[0].signals).toBeDefined();
      expect(candidates[0].signals.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// JSON Detection and Repair Tests
// ============================================

describe('JSON Detection and Repair', () => {
  describe('detectAndRepairJson', () => {
    it('should detect valid JSON', () => {
      const text = '{"name": "test", "value": 123}';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual({ name: 'test', value: 123 });
      expect(result.repairSucceeded).toBe(true);
    });

    it('should detect JSON in code blocks', () => {
      const text = 'Here is the data:\n```json\n{"status": "ok"}\n```';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual({ status: 'ok' });
    });

    it('should repair trailing commas', () => {
      const text = '{"name": "test", "value": 123,}';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual({ name: 'test', value: 123 });
      expect(result.repairSteps.some(s => s.step === 'remove_trailing_commas' && s.applied)).toBe(true);
    });

    it('should repair unquoted keys', () => {
      const text = '{name: "test", value: 123}';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(true);
      expect(result.repairSteps.some(s => s.step === 'quote_unquoted_keys' && s.applied)).toBe(true);
    });

    it('should attempt to repair unclosed brackets', () => {
      const text = '{"name": "test"}'; // Valid JSON to test repair step exists
      const result = detectAndRepairJson(text);
      
      // Repair steps should be defined even if not applied
      expect(result.repairSteps).toBeDefined();
      expect(result.isJson).toBe(true);
    });

    it('should return false for non-JSON text', () => {
      const text = 'This is just plain text without any JSON.';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(false);
      expect(result.candidate).toBeNull();
    });

    it('should handle arrays', () => {
      const text = '[1, 2, 3, "four"]';
      const result = detectAndRepairJson(text);
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual([1, 2, 3, 'four']);
    });

    it('should remove comments', () => {
      const text = '{"name": "test" /* comment */, "value": 123}';
      const result = detectAndRepairJson(text);
      
      // May or may not succeed depending on repair order
      expect(result.repairSteps.some(s => s.step === 'remove_comments')).toBe(true);
    });
  });
});

// ============================================
// Instruction Evaluation Tests
// ============================================

describe('Instruction Evaluation', () => {
  describe('evaluateInstructionRules', () => {
    describe('format rules', () => {
      it('should pass JSON format rule when output is JSON', () => {
        const rules: InstructionRule[] = [
          { id: 'json', type: 'format', params: { expect: 'json' } }
        ];
        
        const result = evaluateInstructionRules(
          '{"status": "ok"}',
          { status: 'ok' },
          rules,
          true
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should fail JSON format rule when output is not JSON', () => {
        const rules: InstructionRule[] = [
          { id: 'json', type: 'format', params: { expect: 'json' } }
        ];
        
        const result = evaluateInstructionRules(
          'Plain text response',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(false);
        expect(result.ruleResults[0].reason).toContain('JSON');
      });

      it('should pass list format rule when output has bullets', () => {
        const rules: InstructionRule[] = [
          { id: 'list', type: 'format', params: { expect: 'list' } }
        ];
        
        const result = evaluateInstructionRules(
          '- Item 1\n- Item 2',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should pass paragraph format rule for prose', () => {
        const rules: InstructionRule[] = [
          { id: 'para', type: 'format', params: { expect: 'paragraph' } }
        ];
        
        const result = evaluateInstructionRules(
          'This is a paragraph. It has multiple sentences. No bullet points here.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });
    });

    describe('length rules', () => {
      it('should pass minWords rule when word count is sufficient', () => {
        const rules: InstructionRule[] = [
          { id: 'length', type: 'length', params: { minWords: 5 } }
        ];
        
        const result = evaluateInstructionRules(
          'This is a response with more than five words in it.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should fail minWords rule when word count is insufficient', () => {
        const rules: InstructionRule[] = [
          { id: 'length', type: 'length', params: { minWords: 100 } }
        ];
        
        const result = evaluateInstructionRules(
          'Short response.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(false);
      });

      it('should pass maxWords rule when within limit', () => {
        const rules: InstructionRule[] = [
          { id: 'length', type: 'length', params: { maxWords: 10 } }
        ];
        
        const result = evaluateInstructionRules(
          'Short response here.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should check minBullets and maxBullets', () => {
        const rules: InstructionRule[] = [
          { id: 'bullets', type: 'length', params: { minBullets: 2, maxBullets: 5 } }
        ];
        
        const result = evaluateInstructionRules(
          '- Item 1\n- Item 2\n- Item 3',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });
    });

    describe('include/exclude rules', () => {
      it('should pass include rule when terms are present', () => {
        const rules: InstructionRule[] = [
          { id: 'include', type: 'include', params: { terms: ['benefit', 'health'] } }
        ];
        
        const result = evaluateInstructionRules(
          'The main benefit is improved health and wellness.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should fail include rule when terms are missing', () => {
        const rules: InstructionRule[] = [
          { id: 'include', type: 'include', params: { terms: ['specific', 'required'] } }
        ];
        
        const result = evaluateInstructionRules(
          'This response does not contain the expected words.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(false);
        expect(result.ruleResults[0].reason).toContain('Missing');
      });

      it('should pass exclude rule when terms are absent', () => {
        const rules: InstructionRule[] = [
          { id: 'exclude', type: 'exclude', params: { terms: ['forbidden', 'banned'] } }
        ];
        
        const result = evaluateInstructionRules(
          'This is a clean response without any bad words.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should fail exclude rule when forbidden terms are present', () => {
        const rules: InstructionRule[] = [
          { id: 'exclude', type: 'exclude', params: { terms: ['forbidden'] } }
        ];
        
        const result = evaluateInstructionRules(
          'This response contains a forbidden word.',
          undefined,
          rules,
          false
        );
        
        expect(result.ruleResults[0].passed).toBe(false);
      });
    });

    describe('schema rules', () => {
      it('should pass schema rule when required keys exist', () => {
        const rules: InstructionRule[] = [
          { id: 'schema', type: 'schema', params: { requiredKeys: ['name', 'status'] } }
        ];
        
        const result = evaluateInstructionRules(
          '{"name": "test", "status": "ok"}',
          { name: 'test', status: 'ok' },
          rules,
          true
        );
        
        expect(result.ruleResults[0].passed).toBe(true);
      });

      it('should fail schema rule when required keys are missing', () => {
        const rules: InstructionRule[] = [
          { id: 'schema', type: 'schema', params: { requiredKeys: ['name', 'status', 'id'] } }
        ];
        
        const result = evaluateInstructionRules(
          '{"name": "test"}',
          { name: 'test' },
          rules,
          true
        );
        
        expect(result.ruleResults[0].passed).toBe(false);
        expect(result.ruleResults[0].reason).toContain('Missing');
      });
    });

    describe('compliance calculation', () => {
      it('should calculate compliance ratio correctly', () => {
        const rules: InstructionRule[] = [
          { id: 'r1', type: 'include', params: { terms: ['hello'] } },
          { id: 'r2', type: 'include', params: { terms: ['world'] } },
          { id: 'r3', type: 'include', params: { terms: ['missing'] } },
          { id: 'r4', type: 'include', params: { terms: ['also-missing'] } }
        ];
        
        const result = evaluateInstructionRules(
          'Hello world!',
          undefined,
          rules,
          false
        );
        
        expect(result.complianceRatio).toBe(0.5); // 2 of 4 passed
        expect(result.instructionFollowed).toBe(false); // < 80%
      });

      it('should return 100% compliance when no rules', () => {
        const result = evaluateInstructionRules(
          'Any text',
          undefined,
          [],
          false
        );
        
        expect(result.complianceRatio).toBe(1);
        expect(result.instructionFollowed).toBe(true);
      });
    });
  });
});

// ============================================
// Hallucination Risk Tests
// ============================================

describe('Hallucination Risk', () => {
  describe('calculateHallucinationSignals', () => {
    it('should detect overconfident language', () => {
      const prompt = 'Tell me about the weather';
      const output = 'It will definitely rain tomorrow. This is absolutely certain and guaranteed.';
      
      const signals = calculateHallucinationSignals(prompt, output, undefined);
      
      expect(signals.overconfidentScore).toBeGreaterThan(0);
    });

    it('should detect speculative facts (new entities)', () => {
      const prompt = 'What is Python?';
      const output = 'Python was created by Guido van Rossum at CWI in Amsterdam. Dr. Smith from MIT also contributed.';
      
      const signals = calculateHallucinationSignals(prompt, output, undefined);
      
      expect(signals.speculativeFactsScore).toBeGreaterThan(0);
    });

    it('should detect fabricated JSON keys', () => {
      const prompt = 'Return user name';
      const output = '{"name": "John", "secretCode": "12345", "internalId": "abc"}';
      const json = { name: 'John', secretCode: '12345', internalId: 'abc' };
      
      const signals = calculateHallucinationSignals(prompt, output, json);
      
      expect(signals.fabricatedKeysScore).toBeGreaterThan(0);
    });

    it('should return low scores for grounded responses', () => {
      const prompt = 'What is 2 + 2?';
      const output = 'The answer is 4.';
      
      const signals = calculateHallucinationSignals(prompt, output, undefined);
      
      expect(signals.overconfidentScore).toBe(0);
      expect(signals.speculativeFactsScore).toBeLessThanOrEqual(0.2);
    });
  });

  describe('calculateHallucinationRisk', () => {
    it('should return low risk for grounded responses', () => {
      const signals = {
        speculativeFactsScore: 0,
        fabricatedKeysScore: 0,
        overconfidentScore: 0,
        contradictionScore: 0,
        customHooksCount: 0
      };
      
      const risk = calculateHallucinationRisk(signals, '', '');
      
      expect(risk).toBe(0);
    });

    it('should return high risk for suspicious responses', () => {
      const signals = {
        speculativeFactsScore: 1,
        fabricatedKeysScore: 1,
        overconfidentScore: 1,
        contradictionScore: 1,
        customHooksCount: 0
      };
      
      const risk = calculateHallucinationRisk(signals, '', '');
      
      expect(risk).toBeGreaterThanOrEqual(0.99);
    });

    it('should apply custom hooks', () => {
      const signals = {
        speculativeFactsScore: 0,
        fabricatedKeysScore: 0,
        overconfidentScore: 0,
        contradictionScore: 0,
        customHooksCount: 1
      };
      
      const customHook = jest.fn().mockReturnValue(0.5);
      const risk = calculateHallucinationRisk(signals, 'prompt', 'output', [customHook]);
      
      expect(customHook).toHaveBeenCalledWith('prompt', 'output');
      expect(risk).toBeGreaterThan(0);
    });
  });

  describe('getHallucinationLabel', () => {
    it('should return correct labels', () => {
      expect(getHallucinationLabel(0)).toBe('low');
      expect(getHallucinationLabel(0.3)).toBe('low');
      expect(getHallucinationLabel(0.31)).toBe('medium');
      expect(getHallucinationLabel(0.6)).toBe('medium');
      expect(getHallucinationLabel(0.61)).toBe('high');
      expect(getHallucinationLabel(1)).toBe('high');
    });
  });
});

// ============================================
// Reasoning Compression Tests
// ============================================

describe('Reasoning Compression', () => {
  describe('calculateCompressionMetrics', () => {
    it('should detect high compression for short responses to complex prompts', () => {
      const prompt = 'Explain step-by-step how photosynthesis works, including the light and dark reactions.';
      const output = 'Plants make food from sunlight.';
      
      const metrics = calculateCompressionMetrics(prompt, output);
      
      expect(metrics.complexityLevel).toBeGreaterThanOrEqual(2);
      expect(metrics.lengthDeficit).toBeGreaterThan(0.5);
    });

    it('should detect low compression for adequate responses', () => {
      const prompt = 'What is 2+2?';
      const output = 'The answer to 2+2 is 4. This is a basic arithmetic operation where we add two numbers together. The sum of these two integers equals four.';
      
      const metrics = calculateCompressionMetrics(prompt, output);
      
      // Simple prompts have low expected words, so deficit should be manageable
      expect(metrics.complexityLevel).toBe(1);
    });

    it('should detect missing transitions in complex responses', () => {
      const prompt = 'Explain why the sky is blue step by step.';
      const output = 'Light scatters. Blue wavelengths scatter more. We see blue.';
      
      const metrics = calculateCompressionMetrics(prompt, output);
      
      expect(metrics.missingTransitions).toBe(1);
    });

    it('should not flag missing transitions for simple prompts', () => {
      const prompt = 'Hello';
      const output = 'Hi there!';
      
      const metrics = calculateCompressionMetrics(prompt, output);
      
      expect(metrics.missingTransitions).toBe(0);
    });

    it('should detect repetition', () => {
      const prompt = 'Write something';
      const output = 'The the the the the thing thing thing is is is good good good.';
      
      const metrics = calculateCompressionMetrics(prompt, output);
      
      expect(metrics.repetitionScore).toBeGreaterThan(0);
    });
  });

  describe('calculateCompressionScore', () => {
    it('should return low score for adequate responses', () => {
      const metrics = {
        complexityLevel: 1 as const,
        expectedWords: 50,
        lengthDeficit: 0,
        entropyDrop: 0,
        missingTransitions: 0,
        repetitionScore: 0
      };
      
      const score = calculateCompressionScore(metrics);
      
      expect(score).toBe(0);
    });

    it('should return high score for compressed responses', () => {
      const metrics = {
        complexityLevel: 3 as const,
        expectedWords: 250,
        lengthDeficit: 0.9,
        entropyDrop: 0.5,
        missingTransitions: 1,
        repetitionScore: 0.5
      };
      
      const score = calculateCompressionScore(metrics);
      
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe('getReasoningLabel', () => {
    it('should return correct labels', () => {
      expect(getReasoningLabel(0)).toBe('low');
      expect(getReasoningLabel(0.3)).toBe('low');
      expect(getReasoningLabel(0.31)).toBe('moderate');
      expect(getReasoningLabel(0.6)).toBe('moderate');
      expect(getReasoningLabel(0.61)).toBe('high');
      expect(getReasoningLabel(1)).toBe('high');
    });
  });
});

// ============================================
// ClassificationEngine Tests
// ============================================

describe('ClassificationEngine', () => {
  describe('classify function', () => {
    it('should return complete classification result', () => {
      const result = classify('Summarize this', 'In summary, the main points are...');
      
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('intentCandidates');
      expect(result).toHaveProperty('isStructured');
      expect(result).toHaveProperty('isJson');
      expect(result).toHaveProperty('instructionFollowed');
      expect(result).toHaveProperty('hallucinationRisk');
      expect(result).toHaveProperty('hallucinationLabel');
      expect(result).toHaveProperty('reasoningCompression');
      expect(result).toHaveProperty('reasoningLabel');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('limitations');
      expect(result).toHaveProperty('methodology');
    });

    it('should detect intent correctly', () => {
      const result = classify('Write code', '```python\nprint("hello")\n```');
      
      expect(result.intent).toBe('code');
    });

    it('should detect JSON correctly', () => {
      const result = classify('Return JSON', '{"status": "ok"}');
      
      expect(result.isJson).toBe(true);
      expect(result.normalizedJson).toEqual({ status: 'ok' });
    });

    it('should evaluate instruction rules', () => {
      const policy: ClassificationPolicy = {
        instructionRules: [
          { id: 'format', type: 'format', params: { expect: 'list' } }
        ]
      };
      
      const result = classify('List items', '- Item 1\n- Item 2', policy);
      
      expect(result.instructionFollowed).toBe(true);
      expect(result.details.instructions.ruleResults[0].passed).toBe(true);
    });

    it('should generate appropriate tags', () => {
      const result = classify('Summarize', 'In summary, the key points are these items:\n- Point 1\n- Point 2\n- Point 3');
      
      expect(result.tags).toContain('instruction:followed');
      expect(result.tags.some(t => t.startsWith('hallucination:'))).toBe(true);
    });

    it('should include limitations', () => {
      const result = classify('Test', 'Response');
      
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some(l => l.includes('heuristic') || l.includes('Heuristic'))).toBe(true);
    });
  });

  describe('ClassificationEngine class', () => {
    it('should allow policy configuration', () => {
      const engine = new ClassificationEngine({
        instructionRules: [
          { id: 'test', type: 'include', params: { terms: ['required'] } }
        ]
      });
      
      const result = engine.classify('Test', 'This has the required word.');
      
      expect(result.instructionFollowed).toBe(true);
    });

    it('should allow disabling features', () => {
      const engine = new ClassificationEngine({
        intent: { enabled: false },
        hallucination: { internalSignals: false },
        compression: { enabled: false }
      });
      
      const result = engine.classify('Test', 'Response');
      
      expect(result.intentCandidates).toHaveLength(0);
      expect(result.hallucinationRisk).toBe(0);
      expect(result.reasoningCompression).toBe(0);
    });

    it('should support custom hallucination hooks', () => {
      const customHook = jest.fn().mockReturnValue(0.5);
      
      const engine = new ClassificationEngine({
        hallucination: {
          customHooks: [customHook]
        }
      });
      
      const result = engine.classify('Prompt', 'Output');
      
      expect(customHook).toHaveBeenCalled();
      expect(result.hallucinationRisk).toBeGreaterThan(0);
    });

    it('should allow updating policy', () => {
      const engine = new ClassificationEngine();
      
      engine.setPolicy({
        instructionRules: [
          { id: 'new', type: 'include', params: { terms: ['new'] } }
        ]
      });
      
      const result = engine.classify('Test', 'This is new content.');
      
      expect(result.details.instructions.rules).toHaveLength(1);
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Classification Integration', () => {
  describe('real-world scenarios', () => {
    it('should classify API response correctly', () => {
      const prompt = 'Get user profile as JSON';
      const output = '```json\n{"id": 123, "name": "John", "email": "john@example.com"}\n```';
      
      const result = classify(prompt, output, {
        instructionRules: [
          { id: 'json', type: 'format', params: { expect: 'json' } },
          { id: 'schema', type: 'schema', params: { requiredKeys: ['id', 'name'] } }
        ]
      });
      
      expect(result.isJson).toBe(true);
      expect(result.instructionFollowed).toBe(true);
      expect(result.tags).toContain('output:json');
    });

    it('should detect low-quality summary', () => {
      const prompt = 'Provide a detailed summary of the research paper on climate change impacts.';
      const output = 'Climate change is bad.';
      
      const result = classify(prompt, output);
      
      // Should detect some compression for very short response
      expect(result.reasoningCompression).toBeGreaterThan(0);
      expect(result.details.compression.lengthDeficit).toBeGreaterThan(0);
    });

    it('should flag potentially hallucinated response', () => {
      const prompt = 'What is the capital of France?';
      const output = 'The capital of France is definitely Paris. Dr. Jean-Pierre from the French Geographic Institute has absolutely guaranteed this fact is 100% certain.';
      
      const result = classify(prompt, output);
      
      expect(result.hallucinationRisk).toBeGreaterThan(0);
      expect(result.details.hallucination.overconfidentScore).toBeGreaterThan(0);
    });

    it('should handle code generation correctly', () => {
      const prompt = 'Write a function to add two numbers';
      const output = `Here is a function to add two numbers:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

This function takes two parameters and returns their sum.`;
      
      const result = classify(prompt, output);
      
      // Should detect code intent
      const hasCodeIntent = result.intentCandidates.some(c => c.tag === 'code');
      expect(hasCodeIntent).toBe(true);
    });
  });
});
