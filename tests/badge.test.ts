/**
 * Tests for badge generation system
 */

import {
  generateBadgeSignature,
  verifyBadgeSignature,
  generateBadgeForProject,
  extractBadgeVerification
} from '../src/badge/generator';

describe('Badge Generation System', () => {
  describe('generateBadgeSignature', () => {
    it('should generate consistent signatures', () => {
      const config = {
        projectName: 'Test Project',
        verifiedDate: '2024-12-04',
        version: '1.4.0'
      };
      
      const sig1 = generateBadgeSignature(config);
      const sig2 = generateBadgeSignature(config);
      
      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(16);
    });
    
    it('should generate different signatures for different projects', () => {
      const config1 = {
        projectName: 'Project A',
        verifiedDate: '2024-12-04',
        version: '1.4.0'
      };
      
      const config2 = {
        projectName: 'Project B',
        verifiedDate: '2024-12-04',
        version: '1.4.0'
      };
      
      const sig1 = generateBadgeSignature(config1);
      const sig2 = generateBadgeSignature(config2);
      
      expect(sig1).not.toBe(sig2);
    });
  });
  
  describe('verifyBadgeSignature', () => {
    it('should verify valid signatures', () => {
      const projectName = 'Test Project';
      const verifiedDate = '2024-12-04';
      const version = '1.4.0';
      
      const signature = generateBadgeSignature({
        projectName,
        verifiedDate,
        version
      });
      
      const isValid = verifyBadgeSignature(
        projectName,
        verifiedDate,
        version,
        signature
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid signatures', () => {
      const isValid = verifyBadgeSignature(
        'Test Project',
        '2024-12-04',
        '1.4.0',
        'invalid-signature'
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should reject tampered data', () => {
      const signature = generateBadgeSignature({
        projectName: 'Original Project',
        verifiedDate: '2024-12-04',
        version: '1.4.0'
      });
      
      const isValid = verifyBadgeSignature(
        'Tampered Project',
        '2024-12-04',
        '1.4.0',
        signature
      );
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('generateBadgeForProject', () => {
    it('should generate badge with all components', () => {
      const result = generateBadgeForProject('Test Project', 'https://example.com');
      
      expect(result.markdown).toContain('Built with llmverify');
      expect(result.html).toContain('Built with llmverify');
      expect(result.signature).toHaveLength(16);
    });
    
    it('should include verification comments', () => {
      const result = generateBadgeForProject('Test Project');
      
      expect(result.markdown).toContain('<!-- project: Test Project -->');
      expect(result.markdown).toContain('<!-- verified:');
      expect(result.markdown).toContain('<!-- version:');
      expect(result.markdown).toContain('<!-- signature:');
    });
    
    it('should reject empty project name', () => {
      expect(() => {
        generateBadgeForProject('');
      }).toThrow('Project name is required');
    });
    
    it('should reject project name over 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(() => {
        generateBadgeForProject(longName);
      }).toThrow('must be less than 100 characters');
    });
    
    it('should reject malicious project names', () => {
      expect(() => {
        generateBadgeForProject('<script>alert("xss")</script>');
      }).toThrow('invalid characters');
      
      expect(() => {
        generateBadgeForProject('javascript:alert(1)');
      }).toThrow('invalid characters');
    });
    
    it('should reject invalid URLs', () => {
      expect(() => {
        generateBadgeForProject('Test', 'not-a-url');
      }).toThrow('Invalid project URL');
      
      expect(() => {
        generateBadgeForProject('Test', 'ftp://example.com');
      }).toThrow('URL must use http or https protocol');
    });
    
    it('should accept valid URLs', () => {
      expect(() => {
        generateBadgeForProject('Test', 'https://example.com');
      }).not.toThrow();
      
      expect(() => {
        generateBadgeForProject('Test', 'http://example.com');
      }).not.toThrow();
    });
  });
  
  describe('extractBadgeVerification', () => {
    it('should extract verification from markdown', () => {
      const markdown = `
[![Built with llmverify](https://img.shields.io/badge/Built_with-llmverify-blue)](https://example.com)

<!-- llmverify badge verification -->
<!-- project: Test Project -->
<!-- verified: 2024-12-04 -->
<!-- version: 1.4.0 -->
<!-- signature: abc123def456 -->
      `;
      
      const verification = extractBadgeVerification(markdown);
      
      expect(verification).not.toBeNull();
      expect(verification?.projectName).toBe('Test Project');
      expect(verification?.verifiedDate).toBe('2024-12-04');
      expect(verification?.version).toBe('1.4.0');
      expect(verification?.signature).toBe('abc123def456');
    });
    
    it('should return null for missing verification', () => {
      const markdown = '# Just a regular README';
      const verification = extractBadgeVerification(markdown);
      
      expect(verification).toBeNull();
    });
    
    it('should validate extracted signatures', () => {
      const { markdown } = generateBadgeForProject('Test Project');
      const verification = extractBadgeVerification(markdown);
      
      expect(verification).not.toBeNull();
      expect(verification?.valid).toBe(true);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should allow badge generation in test mode', () => {
      expect(() => {
        generateBadgeForProject('Unique Project ' + Date.now());
      }).not.toThrow();
      
      // Multiple calls should work in test mode (NODE_ENV=test)
      expect(() => {
        generateBadgeForProject('Unique Project ' + Date.now());
      }).not.toThrow();
    });
  });
});
