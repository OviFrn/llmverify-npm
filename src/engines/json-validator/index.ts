/**
 * JSON Validator Engine
 * 
 * Validates JSON structure and optionally schema.
 * 
 * @module engines/json-validator
 * @author Haiec
 * @license MIT
 */

import { Config } from '../../types/config';
import { JSONResult } from '../../types/results';

export class JSONValidatorEngine {
  private readonly LIMITATIONS = [
    'Basic JSON structure validation',
    'Simple schema validation (type checking only)',
    'Does not validate semantic correctness',
    'Limited repair capabilities'
  ];
  
  private readonly METHODOLOGY = 
    'Parses JSON content and validates structure. Performs basic schema ' +
    'validation if schema is provided. Attempts simple repairs for common issues.';
  
  constructor(private _config: Config) {}
  
  async validate(content: string, schema?: unknown): Promise<JSONResult> {
    let parsed: unknown = null;
    let valid = false;
    let repaired = false;
    let repairMethod: string | undefined;
    const issues: string[] = [];
    
    // Try to parse
    try {
      parsed = JSON.parse(content);
      valid = true;
    } catch (e) {
      // Try to repair
      const repairResult = this.attemptRepair(content);
      if (repairResult.success) {
        parsed = repairResult.parsed;
        valid = true;
        repaired = true;
        repairMethod = repairResult.method;
        issues.push(`Repaired: ${repairMethod}`);
      } else {
        issues.push(`Parse error: ${(e as Error).message}`);
      }
    }
    
    // Schema validation
    let schemaValid = true;
    const schemaErrors: string[] = [];
    
    if (valid && schema && parsed) {
      const schemaResult = this.validateSchema(parsed, schema);
      schemaValid = schemaResult.valid;
      schemaErrors.push(...schemaResult.errors);
    }
    
    // Structure analysis
    const structure = this.analyzeStructure(parsed);
    structure.issues.push(...issues);
    
    return {
      valid,
      parsed,
      schema,
      schemaValid,
      schemaErrors,
      repaired,
      repairMethod,
      structure,
      limitations: this.LIMITATIONS,
      methodology: this.METHODOLOGY
    };
  }
  
  private attemptRepair(content: string): { success: boolean; parsed?: unknown; method?: string } {
    // Try common repairs
    const repairs = [
      {
        name: 'trailing comma removal',
        fix: (s: string) => s.replace(/,\s*([\]}])/g, '$1')
      },
      {
        name: 'single to double quotes',
        fix: (s: string) => s.replace(/'/g, '"')
      },
      {
        name: 'unquoted keys',
        fix: (s: string) => s.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      },
      {
        name: 'extract JSON from text',
        fix: (s: string) => {
          const match = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          return match ? match[0] : s;
        }
      }
    ];
    
    for (const repair of repairs) {
      try {
        const fixed = repair.fix(content);
        const parsed = JSON.parse(fixed);
        return { success: true, parsed, method: repair.name };
      } catch {
        continue;
      }
    }
    
    return { success: false };
  }
  
  private validateSchema(
    data: unknown, 
    schema: unknown
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (typeof schema !== 'object' || schema === null) {
      return { valid: true, errors: [] };
    }
    
    const schemaObj = schema as Record<string, unknown>;
    
    if (typeof data !== 'object' || data === null) {
      errors.push('Data is not an object');
      return { valid: false, errors };
    }
    
    const dataObj = data as Record<string, unknown>;
    
    // Simple type checking
    for (const [key, expectedType] of Object.entries(schemaObj)) {
      if (!(key in dataObj)) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }
      
      const actualType = typeof dataObj[key];
      
      if (expectedType === 'array') {
        if (!Array.isArray(dataObj[key])) {
          errors.push(`Field ${key}: expected array, got ${actualType}`);
        }
      } else if (actualType !== expectedType) {
        errors.push(`Field ${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  private analyzeStructure(data: unknown): { depth: number; keyCount: number; issues: string[] } {
    if (data === null || data === undefined) {
      return { depth: 0, keyCount: 0, issues: ['No valid data to analyze'] };
    }
    
    const depth = this.calculateDepth(data);
    const keyCount = this.countKeys(data);
    const issues: string[] = [];
    
    if (depth > 10) {
      issues.push('Deep nesting detected (>10 levels)');
    }
    
    if (keyCount > 1000) {
      issues.push('Large object detected (>1000 keys)');
    }
    
    return { depth, keyCount, issues };
  }
  
  private calculateDepth(data: unknown, current = 0): number {
    if (typeof data !== 'object' || data === null) {
      return current;
    }
    
    if (Array.isArray(data)) {
      return Math.max(current, ...data.map(item => this.calculateDepth(item, current + 1)));
    }
    
    const values = Object.values(data as Record<string, unknown>);
    if (values.length === 0) return current;
    
    return Math.max(...values.map(v => this.calculateDepth(v, current + 1)));
  }
  
  private countKeys(data: unknown): number {
    if (typeof data !== 'object' || data === null) {
      return 0;
    }
    
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.countKeys(item), 0);
    }
    
    const obj = data as Record<string, unknown>;
    let count = Object.keys(obj).length;
    
    for (const value of Object.values(obj)) {
      count += this.countKeys(value);
    }
    
    return count;
  }
}
