/**
 * Plugin API
 * 
 * High-level API for creating and using plugins
 * 
 * @module plugins/api
 */

import { Plugin, PluginFunction, getPluginRegistry } from './registry';

/**
 * Helper function to create a plugin
 */
export function createPlugin(config: {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  category?: Plugin['category'];
  enabled?: boolean;
  priority?: number;
  execute: PluginFunction;
}): Plugin {
  return {
    id: config.id,
    name: config.name,
    version: config.version || '1.0.0',
    description: config.description,
    author: config.author,
    category: config.category || 'custom',
    enabled: config.enabled !== false,
    priority: config.priority || 0,
    execute: config.execute
  };
}

/**
 * Use a plugin (register and enable)
 */
export function use(plugin: Plugin): void {
  const registry = getPluginRegistry();
  registry.register(plugin);
}

/**
 * Create a blacklist plugin
 */
export function createBlacklistPlugin(blacklist: string[], options?: {
  id?: string;
  name?: string;
  caseSensitive?: boolean;
}): Plugin {
  return createPlugin({
    id: options?.id || 'blacklist',
    name: options?.name || 'Blacklist Filter',
    description: 'Detects blacklisted words',
    category: 'security',
    execute: (context) => {
      const findings: any[] = [];
      const content = options?.caseSensitive ? context.content : context.content.toLowerCase();
      
      for (const word of blacklist) {
        const searchWord = options?.caseSensitive ? word : word.toLowerCase();
        if (content.includes(searchWord)) {
          findings.push({
            category: 'security',
            severity: 'medium',
            message: `Blacklisted term detected: ${word}`
          });
        }
      }
      
      return {
        findings,
        score: findings.length > 0 ? 0.5 : 0
      };
    }
  });
}

/**
 * Create a regex pattern plugin
 */
export function createRegexPlugin(patterns: Array<{
  pattern: RegExp;
  message: string;
  severity?: string;
}>, options?: {
  id?: string;
  name?: string;
}): Plugin {
  return createPlugin({
    id: options?.id || 'regex-patterns',
    name: options?.name || 'Regex Patterns',
    description: 'Detects custom regex patterns',
    category: 'custom',
    execute: (context) => {
      const findings: any[] = [];
      
      for (const { pattern, message, severity } of patterns) {
        try {
          const matches = context.content.match(pattern);
          if (matches) {
            findings.push({
              category: 'custom',
              severity: severity || 'medium',
              message: message
            });
          }
        } catch (error) {
          console.error('Regex pattern error:', error);
        }
      }
      
      return {
        findings,
        score: findings.length > 0 ? 0.5 : 0
      };
    }
  });
}

/**
 * Create a length validator plugin
 */
export function createLengthValidatorPlugin(config: {
  min?: number;
  max?: number;
}, options?: {
  id?: string;
  name?: string;
}): Plugin {
  return createPlugin({
    id: options?.id || 'length-validator',
    name: options?.name || 'Length Validator',
    description: 'Validates content length',
    category: 'quality',
    execute: (context) => {
      const findings: any[] = [];
      const length = context.content.length;
      
      if (config.min && length < config.min) {
        findings.push({
          category: 'quality',
          severity: 'low',
          message: `Content too short: ${length} < ${config.min}`,
          metadata: { length, min: config.min }
        });
      }
      
      if (config.max && length > config.max) {
        findings.push({
          category: 'quality',
          severity: 'medium',
          message: `Content too long: ${length} > ${config.max}`,
          metadata: { length, max: config.max }
        });
      }
      
      return {
        findings,
        score: findings.length > 0 ? 0.3 : 0
      };
    }
  });
}

/**
 * Create a keyword detector plugin
 */
export function createKeywordDetectorPlugin(keywords: {
  required?: string[];
  forbidden?: string[];
}, options?: {
  id?: string;
  name?: string;
  caseSensitive?: boolean;
}): Plugin {
  return createPlugin({
    id: options?.id || 'keyword-detector',
    name: options?.name || 'Keyword Detector',
    description: 'Detects required and forbidden keywords',
    category: 'quality',
    execute: (context) => {
      const findings: any[] = [];
      const content = options?.caseSensitive ? context.content : context.content.toLowerCase();
      
      // Check required keywords
      if (keywords.required) {
        for (const keyword of keywords.required) {
          const searchKeyword = options?.caseSensitive ? keyword : keyword.toLowerCase();
          if (!content.includes(searchKeyword)) {
            findings.push({
              category: 'quality',
              severity: 'medium',
              message: `Required keyword missing: ${keyword}`
            });
          }
        }
      }
      
      // Check forbidden keywords
      if (keywords.forbidden) {
        for (const keyword of keywords.forbidden) {
          const searchKeyword = options?.caseSensitive ? keyword : keyword.toLowerCase();
          if (content.includes(searchKeyword)) {
            findings.push({
              category: 'security',
              severity: 'high',
              message: `Forbidden keyword detected: ${keyword}`
            });
          }
        }
      }
      
      return {
        findings,
        score: findings.length > 0 ? 0.6 : 0
      };
    }
  });
}
