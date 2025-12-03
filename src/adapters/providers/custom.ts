/**
 * Custom Adapter
 * 
 * Adapter for any custom LLM provider or API.
 * 
 * @module adapters/providers/custom
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Custom client interface - must implement generate method.
 */
interface CustomClient {
  generate(request: LlmRequest): Promise<LlmResponse>;
  embed?(input: string | string[]): Promise<number[][]>;
  stream?(request: LlmRequest): AsyncIterable<string>;
  healthCheck?(): Promise<boolean>;
}

/**
 * Builds a custom adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for custom provider
 * 
 * @example
 * // Wrap any API
 * const llm = buildCustomAdapter({
 *   provider: 'custom',
 *   providerName: 'My API',
 *   client: {
 *     async generate(request) {
 *       const res = await fetch('https://my-api.com/generate', {
 *         method: 'POST',
 *         body: JSON.stringify({ prompt: request.prompt })
 *       });
 *       const data = await res.json();
 *       return { text: data.output, tokens: data.tokens };
 *     }
 *   }
 * });
 * 
 * @example
 * // Wrap existing SDK
 * const llm = buildCustomAdapter({
 *   provider: 'custom',
 *   providerName: 'Together AI',
 *   client: {
 *     async generate(request) {
 *       const response = await togetherClient.chat.completions.create({
 *         model: request.model ?? 'meta-llama/Llama-3-70b-chat-hf',
 *         messages: [{ role: 'user', content: request.prompt }]
 *       });
 *       return {
 *         text: response.choices[0].message.content,
 *         tokens: response.usage?.completion_tokens ?? 0
 *       };
 *     }
 *   }
 * });
 */
export function buildCustomAdapter(config: AdapterConfig): LlmClient {
  const client = config.client as CustomClient;
  
  if (!client || typeof client.generate !== 'function') {
    throw new AdapterConfigError(
      'custom',
      'Custom adapter requires client with generate(request: LlmRequest): Promise<LlmResponse> method'
    );
  }

  return {
    provider: 'custom',
    providerName: config.providerName ?? 'Custom Provider',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      const response = await client.generate(request);
      
      // Ensure response has required fields
      return {
        text: response.text ?? '',
        tokens: response.tokens ?? estimateTokens(response.text ?? ''),
        totalTokens: response.totalTokens,
        model: response.model ?? request.model,
        finishReason: response.finishReason,
        raw: response.raw
      };
    },

    embed: client.embed ? async (input) => client.embed!(input) : undefined,
    stream: client.stream ? (request) => client.stream!(request) : undefined,
    healthCheck: client.healthCheck ? async () => client.healthCheck!() : undefined
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}
