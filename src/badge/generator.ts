/**
 * Badge Generator and Verification
 * 
 * Generate "Built with llmverify" badges for verified applications
 * 
 * @module badge/generator
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Badge configuration
 */
export interface BadgeConfig {
  projectName: string;
  projectUrl?: string;
  verifiedDate: string;
  version: string;
}

/**
 * Badge verification data
 */
export interface BadgeVerification {
  projectName: string;
  verifiedDate: string;
  version: string;
  signature: string;
  valid: boolean;
}

/**
 * Generate badge verification signature
 */
export function generateBadgeSignature(config: BadgeConfig): string {
  const data = `${config.projectName}:${config.verifiedDate}:${config.version}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Verify badge signature
 */
export function verifyBadgeSignature(
  projectName: string,
  verifiedDate: string,
  version: string,
  signature: string
): boolean {
  const expectedSignature = generateBadgeSignature({
    projectName,
    verifiedDate,
    version
  });
  return signature === expectedSignature;
}

/**
 * Generate badge markdown
 */
export function generateBadgeMarkdown(config: BadgeConfig): string {
  const signature = generateBadgeSignature(config);
  
  const badgeUrl = config.projectUrl 
    ? `https://img.shields.io/badge/Built_with-llmverify-blue?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkw0IDZWMTJDNCAyMC41IDEyIDIyIDEyIDIyQzEyIDIyIDIwIDIwLjUgMjAgMTJWNkwxMiAyWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNOSAxMkwxMSAxNEwxNSAxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+`
    : 'https://img.shields.io/badge/Built_with-llmverify-blue';
  
  const linkUrl = config.projectUrl || 'https://github.com/subodhkc/llmverify-npm';
  
  return `[![Built with llmverify](${badgeUrl})](${linkUrl})

<!-- llmverify badge verification -->
<!-- project: ${config.projectName} -->
<!-- verified: ${config.verifiedDate} -->
<!-- version: ${config.version} -->
<!-- signature: ${signature} -->`;
}

/**
 * Generate badge HTML
 */
export function generateBadgeHTML(config: BadgeConfig): string {
  const signature = generateBadgeSignature(config);
  const linkUrl = config.projectUrl || 'https://github.com/subodhkc/llmverify-npm';
  
  return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Built_with-llmverify-blue" alt="Built with llmverify" />
</a>

<!-- llmverify badge verification -->
<!-- project: ${config.projectName} -->
<!-- verified: ${config.verifiedDate} -->
<!-- version: ${config.version} -->
<!-- signature: ${signature} -->`;
}

/**
 * Extract badge verification from markdown/HTML
 */
export function extractBadgeVerification(content: string): BadgeVerification | null {
  const projectMatch = content.match(/<!-- project: (.+?) -->/);
  const verifiedMatch = content.match(/<!-- verified: (.+?) -->/);
  const versionMatch = content.match(/<!-- version: (.+?) -->/);
  const signatureMatch = content.match(/<!-- signature: (.+?) -->/);
  
  if (!projectMatch || !verifiedMatch || !versionMatch || !signatureMatch) {
    return null;
  }
  
  const projectName = projectMatch[1];
  const verifiedDate = verifiedMatch[1];
  const version = versionMatch[1];
  const signature = signatureMatch[1];
  
  const valid = verifyBadgeSignature(projectName, verifiedDate, version, signature);
  
  return {
    projectName,
    verifiedDate,
    version,
    signature,
    valid
  };
}

/**
 * Validate badge generation request
 */
function validateBadgeRequest(projectName: string, projectUrl?: string): void {
  // Validate project name
  if (!projectName || projectName.trim().length === 0) {
    throw new Error('Project name is required');
  }
  
  if (projectName.length > 100) {
    throw new Error('Project name must be less than 100 characters');
  }
  
  // Prevent malicious names
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /eval\(/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(projectName))) {
    throw new Error('Project name contains invalid characters');
  }
  
  // Validate URL if provided
  if (projectUrl) {
    try {
      const url = new URL(projectUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL must use http or https protocol');
      }
    } catch (error: any) {
      if (error.message === 'URL must use http or https protocol') {
        throw error;
      }
      throw new Error('Invalid project URL');
    }
  }
  
  // Rate limiting check (simple in-memory)
  // Only enforce in production, not in tests
  if (process.env.NODE_ENV !== 'test') {
    const now = Date.now();
    const key = `badge:${projectName}`;
    
    if (typeof global !== 'undefined') {
      const cache = (global as any).__badgeCache || {};
      const lastGenerated = cache[key];
      
      if (lastGenerated && now - lastGenerated < 60000) {
        throw new Error('Badge generation rate limit exceeded. Please wait 1 minute.');
      }
      
      cache[key] = now;
      (global as any).__badgeCache = cache;
    }
  }
}

/**
 * CLI helper to generate badge
 */
export function generateBadgeForProject(
  projectName: string,
  projectUrl?: string,
  version?: string
): { markdown: string; html: string; signature: string } {
  // Validate request
  validateBadgeRequest(projectName, projectUrl);
  
  const config: BadgeConfig = {
    projectName: projectName.trim(),
    projectUrl,
    verifiedDate: new Date().toISOString().split('T')[0],
    version: version || require('../../package.json').version
  };
  
  const signature = generateBadgeSignature(config);
  const markdown = generateBadgeMarkdown(config);
  const html = generateBadgeHTML(config);
  
  return { markdown, html, signature };
}

/**
 * Save badge to file
 */
export function saveBadgeToFile(
  outputPath: string,
  projectName: string,
  projectUrl?: string
): void {
  const { markdown, html } = generateBadgeForProject(projectName, projectUrl);
  
  const content = `# llmverify Badge

## Markdown

\`\`\`markdown
${markdown}
\`\`\`

## HTML

\`\`\`html
${html}
\`\`\`

## Usage

Copy the markdown or HTML code above and paste it into your README.md or website.

The badge verifies that your project uses llmverify for AI output verification.
`;
  
  fs.writeFileSync(outputPath, content, 'utf-8');
}
