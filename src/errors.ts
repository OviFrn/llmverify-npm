/**
 * llmverify Error Classes
 * 
 * Custom error types for clear error handling.
 * 
 * @module errors
 * @author Haiec
 * @license MIT
 */

/**
 * Base error class for llmverify
 */
export class LLMVerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMVerifyError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Privacy violation error
 * 
 * Thrown when an operation would violate privacy guarantees.
 * This is a CRITICAL error - free tier must never make network requests.
 */
export class PrivacyViolationError extends LLMVerifyError {
  constructor(message: string) {
    super(message);
    this.name = 'PrivacyViolationError';
  }
}

/**
 * Validation error
 * 
 * Thrown when input validation fails.
 */
export class ValidationError extends LLMVerifyError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Verification error
 * 
 * Thrown when verification process fails.
 */
export class VerificationError extends LLMVerifyError {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationError';
  }
}

/**
 * Configuration error
 * 
 * Thrown when configuration is invalid.
 */
export class ConfigurationError extends LLMVerifyError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Engine error
 * 
 * Thrown when an engine fails during processing.
 */
export class EngineError extends LLMVerifyError {
  public readonly engineName: string;
  
  constructor(engineName: string, message: string) {
    super(`[${engineName}] ${message}`);
    this.name = 'EngineError';
    this.engineName = engineName;
  }
}
