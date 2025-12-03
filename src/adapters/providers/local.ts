/**
 * Local Adapter
 * 
 * Adapter for local LLM inference (llama.cpp, vLLM, Ollama, etc.)
 * 
 * @module adapters/providers/local
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Local inference function type.
 */
type LocalInferenceFn = (prompt: string, options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) => Promise<string | { text: string; tokens?: number }>;

/**
 * Builds a local adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for local inference
 * 
 * @example
 * // Simple function
 * const llm = buildLocalAdapter({
 *   provider: 'local',
 *   client: async (prompt) => await myLocalModel(prompt)
 * });
 * 
 * @example
 * // With Ollama
 * import ollama from 'ollama';
 * const llm = buildLocalAdapter({
 *   provider: 'local',
 *   client: async (prompt, opts) => {
 *     const response = await ollama.generate({
 *       model: opts?.model ?? 'llama3',
 *       prompt
 *     });
 *     return response.response;
 *   },
 *   defaultModel: 'llama3'
 * });
 * 
 * @example
 * // With llama.cpp server
 * const llm = buildLocalAdapter({
 *   provider: 'local',
 *   client: async (prompt) => {
 *     const res = await fetch('http://localhost:8080/completion', {
 *       method: 'POST',
 *       body: JSON.stringify({ prompt })
 *     });
 *     const data = await res.json();
 *     return data.content;
 *   }
 * });
 */
export function buildLocalAdapter(config: AdapterConfig): LlmClient {
  if (typeof config.client !== 'function') {
    throw new AdapterConfigError(
      'local',
      'Local adapter requires client as a function: (prompt: string, options?) => Promise<string | { text, tokens }>'
    );
  }

  const fn = config.client as LocalInferenceFn;
  const defaultModel = config.defaultModel ?? 'local';

  return {
    provider: 'local',
    providerName: config.providerName ?? 'Local Model',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      // Build prompt with system instruction if provided
      let prompt = request.prompt;
      if (request.system) {
        prompt = `${request.system}\n\n${request.prompt}`;
      }

      const result = await fn(prompt, {
        model: request.model || defaultModel,
        temperature: request.temperature,
        maxTokens: request.maxTokens
      });

      // Handle both string and object responses
      let text: string;
      let tokens: number;

      if (typeof result === 'string') {
        text = result;
        tokens = estimateTokens(text);
      } else {
        text = result.text;
        tokens = result.tokens ?? estimateTokens(text);
      }

      return {
        text,
        tokens,
        model: request.model || defaultModel,
        finishReason: 'stop',
        raw: null
      };
    },

    async healthCheck(): Promise<boolean> {
      try {
        const result = await fn('test', { maxTokens: 1 });
        return typeof result === 'string' ? result.length > 0 : result.text.length > 0;
      } catch {
        return false;
      }
    }
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}
