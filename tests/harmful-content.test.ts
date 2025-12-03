/**
 * Harmful Content Detection Tests
 */

import { checkHarmfulContent } from '../src/csm6/security/harmful-content';

describe('Harmful Content Detection', () => {
  describe('checkHarmfulContent', () => {
    it('should return empty array for safe content', () => {
      const content = 'The weather is nice today. Let us go for a walk.';
      const findings = checkHarmfulContent(content);
      expect(findings).toHaveLength(0);
    });

    it('should detect violence patterns', () => {
      const content = 'I want to kill him for what he did.';
      const findings = checkHarmfulContent(content);
      
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('HARMFUL_VIOLENCE');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect threat patterns', () => {
      const content = 'I will hurt you if you do not comply.';
      const findings = checkHarmfulContent(content);
      
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('HARMFUL_THREATS');
    });

    it('should detect self-harm patterns', () => {
      const content = 'Looking for suicide methods online.';
      const findings = checkHarmfulContent(content);
      
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('HARMFUL_SELF_HARM');
      expect(findings[0].severity).toBe('critical');
    });

    it('should detect dangerous instructions', () => {
      const content = 'How to hack into a bank account.';
      const findings = checkHarmfulContent(content);
      
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('HARMFUL_DANGEROUS_INSTRUCTIONS');
    });

    it('should detect hate speech', () => {
      const content = 'They are an inferior race of people.';
      const findings = checkHarmfulContent(content);
      
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('HARMFUL_HATE_SPEECH');
    });

    it('should include proper finding structure', () => {
      const content = 'I will kill you for this.';
      const findings = checkHarmfulContent(content);
      
      expect(findings[0]).toHaveProperty('id');
      expect(findings[0]).toHaveProperty('category', 'safety');
      expect(findings[0]).toHaveProperty('severity');
      expect(findings[0]).toHaveProperty('message');
      expect(findings[0]).toHaveProperty('recommendation');
      expect(findings[0]).toHaveProperty('evidence');
      expect(findings[0]).toHaveProperty('confidence');
      expect(findings[0]).toHaveProperty('limitations');
      expect(findings[0]).toHaveProperty('methodology');
    });

    it('should include confidence score with interval', () => {
      const content = 'How to kill someone without getting caught.';
      const findings = checkHarmfulContent(content);
      
      expect(findings[0].confidence).toHaveProperty('value');
      expect(findings[0].confidence).toHaveProperty('interval');
      expect(findings[0].confidence).toHaveProperty('method', 'heuristic');
    });

    it('should not duplicate findings for same category', () => {
      const content = 'Kill him. Murder her. Execute them all.';
      const findings = checkHarmfulContent(content);
      
      const violenceFindings = findings.filter(f => f.id === 'HARMFUL_VIOLENCE');
      expect(violenceFindings.length).toBe(1);
    });

    describe('false positive handling', () => {
      it('should skip educational context', () => {
        const content = 'Warning: This is an example of what not to say. Never say "I will kill you".';
        const findings = checkHarmfulContent(content);
        expect(findings).toHaveLength(0);
      });

      it('should skip fiction context', () => {
        const content = 'In the story, the character says "I will kill you" to the villain.';
        const findings = checkHarmfulContent(content);
        expect(findings).toHaveLength(0);
      });

      it('should skip news context', () => {
        const content = 'According to the news article, the suspect threatened to kill the victim.';
        const findings = checkHarmfulContent(content);
        expect(findings).toHaveLength(0);
      });

      it('should skip training/policy context', () => {
        const content = 'For training purposes, harmful content includes phrases like "kill them all".';
        const findings = checkHarmfulContent(content);
        expect(findings).toHaveLength(0);
      });

      it('should skip prevention/awareness context', () => {
        const content = 'Suicide prevention awareness: detecting phrases like "how to commit suicide" is important.';
        const findings = checkHarmfulContent(content);
        expect(findings).toHaveLength(0);
      });
    });

    it('should handle empty content', () => {
      const findings = checkHarmfulContent('');
      expect(findings).toHaveLength(0);
    });

    it('should handle content with no matches', () => {
      const content = 'This is a completely normal sentence about cooking pasta.';
      const findings = checkHarmfulContent(content);
      expect(findings).toHaveLength(0);
    });
  });
});
