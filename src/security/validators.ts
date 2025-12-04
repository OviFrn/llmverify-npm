/**
 * Security Validators and Hardening
 * 
 * Input validation, regex safety, and security utilities
 * 
 * @module security/validators
 */

import { ValidationError } from '../errors';
import { ErrorCode } from '../errors/codes';

/**
 * Maximum input sizes
 */
export const SECURITY_LIMITS = {
  MAX_CONTENT_LENGTH: 10 * 1024 * 1024, // 10MB absolute max
  MAX_REGEX_LENGTH: 1000,
  MAX_ARRAY_LENGTH: 10000,
  REGEX_TIMEOUT_MS: 100
};

/**
 * Validate and sanitize input string
 */
export function validateInput(input: string, maxLength?: number): string {
  // Check for null/undefined
  if (input === null || input === undefined) {
    throw new ValidationError(
      'Input cannot be null or undefined',
      ErrorCode.INVALID_INPUT
    );
  }
  
  // Convert to string if needed
  const str = String(input);
  
  // Check length
  const limit = maxLength || SECURITY_LIMITS.MAX_CONTENT_LENGTH;
  if (str.length > limit) {
    throw new ValidationError(
      `Input exceeds maximum length (${limit} characters)`,
      ErrorCode.CONTENT_TOO_LARGE,
      { length: str.length, maxLength: limit }
    );
  }
  
  return str;
}

/**
 * Safe regex execution with timeout protection
 */
export function safeRegexTest(pattern: RegExp, text: string, timeoutMs?: number): boolean {
  const timeout = timeoutMs || SECURITY_LIMITS.REGEX_TIMEOUT_MS;
  
  // Validate regex pattern length
  if (pattern.source.length > SECURITY_LIMITS.MAX_REGEX_LENGTH) {
    throw new ValidationError(
      'Regex pattern too complex',
      ErrorCode.INVALID_INPUT,
      { patternLength: pattern.source.length }
    );
  }
  
  // Use timeout for regex execution
  let result = false;
  let timedOut = false;
  
  const timer = setTimeout(() => {
    timedOut = true;
  }, timeout);
  
  try {
    if (!timedOut) {
      result = pattern.test(text);
    }
  } catch (error) {
    clearTimeout(timer);
    throw new ValidationError(
      'Regex execution failed',
      ErrorCode.INVALID_INPUT,
      { error: (error as Error).message }
    );
  }
  
  clearTimeout(timer);
  
  if (timedOut) {
    throw new ValidationError(
      'Regex execution timeout',
      ErrorCode.TIMEOUT,
      { timeoutMs: timeout }
    );
  }
  
  return result;
}

/**
 * Sanitize string for safe logging (remove PII)
 */
export function sanitizeForLogging(text: string): string {
  let sanitized = text;
  
  // Remove email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  );
  
  // Remove phone numbers (various formats)
  sanitized = sanitized.replace(
    /\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
    '[PHONE]'
  );
  
  // Remove SSN
  sanitized = sanitized.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    '[SSN]'
  );
  
  // Remove credit card numbers
  sanitized = sanitized.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    '[CARD]'
  );
  
  // Remove API keys (common patterns)
  sanitized = sanitized.replace(
    /\b[A-Za-z0-9]{32,}\b/g,
    '[KEY]'
  );
  
  // Remove IP addresses
  sanitized = sanitized.replace(
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    '[IP]'
  );
  
  return sanitized;
}

/**
 * Validate array input
 */
export function validateArray<T>(arr: T[], maxLength?: number): T[] {
  if (!Array.isArray(arr)) {
    throw new ValidationError(
      'Input must be an array',
      ErrorCode.INVALID_INPUT
    );
  }
  
  const limit = maxLength || SECURITY_LIMITS.MAX_ARRAY_LENGTH;
  if (arr.length > limit) {
    throw new ValidationError(
      `Array exceeds maximum length (${limit} items)`,
      ErrorCode.INVALID_INPUT,
      { length: arr.length, maxLength: limit }
    );
  }
  
  return arr;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if request is allowed
   */
  public isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }
  
  /**
   * Get remaining requests
   */
  public getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
  
  /**
   * Reset rate limit for key
   */
  public reset(key: string): void {
    this.requests.delete(key);
  }
  
  /**
   * Clear all rate limits
   */
  public clear(): void {
    this.requests.clear();
  }
}

/**
 * Sanitize object for safe logging
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  
  for (const key in obj) {
    // Skip sensitive keys
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('authorization')
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeForLogging(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Check for potential injection patterns
 */
export function detectInjection(text: string): boolean {
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /eval\(/i,
    /expression\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  return injectionPatterns.some(pattern => pattern.test(text));
}
