/**
 * Model-Agnostic Adapter Types
 * 
 * Unified interface for any LLM provider. LLMverify doesn't care if
 * the underlying provider is OpenAI, Anthropic, Groq, or local.
 * 
 * WHAT THIS PROVIDES:
 * - Single unified LlmClient interface
 * - Pluggable adapters per provider
 * - Zero provider logic in engines/monitor
 * - Easy to extend without breaking API
 * 
 * WHAT THIS DOES NOT DO:
 * - Handle authentication (use provider SDKs)
 * - Manage API keys (pass via config)
 * - Rate limit or retry (use provider SDK features)
 * 
 * @module adapters/types
 * @author Haiec
 * @license MIT
 */

/**
 * Supported LLM provider identifiers.
 * Use 'custom' for any provider not explicitly listed.
 */
export type ProviderId = 
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'google'
  | 'deepseek'
  | 'mistral'
  | 'cohere'
  | 'local'
  | 'custom';

/**
 * Normalized request format for all providers.
 * Adapters translate this to provider-specific formats.
 */
export interface LlmRequest {
  /** Model identifier (e.g., "gpt-4", "claude-3-sonnet") */
  model?: string;
  /** User prompt / message */
  prompt: string;
  /** System prompt (if supported by provider) */
  system?: string;
  /** Temperature (0-2, provider-dependent) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Stop sequences */
  stop?: string[];
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Normalized response format from all providers.
 * Adapters translate provider responses to this format.
 */
export interface LlmResponse {
  /** Generated text content */
  text: string;
  /** Token count (completion tokens) */
  tokens: number;
  /** Total tokens (prompt + completion) if available */
  totalTokens?: number;
  /** Model used for generation */
  model?: string;
  /** Finish reason if available */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' | string;
  /** Raw provider response (for debugging/advanced use) */
  raw?: unknown;
}

/**
 * Unified LLM client interface.
 * All adapters implement this interface.
 */
export interface LlmClient {
  /** Provider identifier */
  readonly provider: ProviderId;
  
  /** Provider name for display */
  readonly providerName?: string;
  
  /**
   * Generate a completion.
   * @param request - Normalized request
   * @returns Normalized response
   */
  generate(request: LlmRequest): Promise<LlmResponse>;
  
  /**
   * Generate embeddings (optional).
   * @param input - Text or array of texts
   * @returns Array of embedding vectors
   */
  embed?(input: string | string[]): Promise<number[][]>;
  
  /**
   * Stream a completion (optional).
   * @param request - Normalized request
   * @returns Async iterator of text chunks
   */
  stream?(request: LlmRequest): AsyncIterable<string>;
  
  /**
   * Check if the client is healthy/connected.
   * @returns True if healthy
   */
  healthCheck?(): Promise<boolean>;
}

/**
 * Configuration for creating an adapter.
 */
export interface AdapterConfig {
  /** Provider identifier */
  provider: ProviderId;
  
  /** 
   * Existing SDK client instance (preferred).
   * For 'local' provider, this should be a function: (prompt: string) => Promise<string>
   */
  client?: unknown;
  
  /** API key (if not using existing client) */
  apiKey?: string;
  
  /** Base URL override (for proxies or self-hosted) */
  baseUrl?: string;
  
  /** Default model to use if not specified in request */
  defaultModel?: string;
  
  /** Provider-specific extra configuration */
  extra?: Record<string, unknown>;
  
  /** Custom provider name (for 'custom' provider) */
  providerName?: string;
}

/**
 * Adapter builder function type.
 * Used internally by the adapter registry.
 */
export type AdapterBuilder = (config: AdapterConfig) => LlmClient;

/**
 * Error thrown when adapter creation fails.
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderId,
    public readonly cause?: Error
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AdapterError';
  }
}

/**
 * Error thrown when a provider is not supported.
 */
export class UnsupportedProviderError extends AdapterError {
  constructor(provider: string) {
    super(
      `No adapter registered for provider: ${provider}. ` +
      `Supported providers: openai, anthropic, groq, google, deepseek, mistral, cohere, local, custom`,
      provider as ProviderId
    );
    this.name = 'UnsupportedProviderError';
  }
}

/**
 * Error thrown when adapter configuration is invalid.
 */
export class AdapterConfigError extends AdapterError {
  constructor(provider: ProviderId, message: string) {
    super(message, provider);
    this.name = 'AdapterConfigError';
  }
}
