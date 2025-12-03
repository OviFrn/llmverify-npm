/**
 * Cohere Adapter
 * 
 * Adapter for Cohere API (Command models)
 * 
 * @module adapters/providers/cohere
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Cohere client interface.
 */
interface CohereClient {
  chat(params: {
    model: string;
    message: string;
    preamble?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  }): Promise<{
    text: string;
    meta?: {
      tokens?: {
        outputTokens?: number;
        inputTokens?: number;
      };
    };
    finishReason?: string;
  }>;
  embed?(params: { texts: string[]; model?: string }): Promise<{
    embeddings: number[][];
  }>;
}

/**
 * Builds a Cohere adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for Cohere
 * 
 * @example
 * import { CohereClient } from 'cohere-ai';
 * const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
 * const llm = buildCohereAdapter({ provider: 'cohere', client: cohere });
 */
export function buildCohereAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'cohere',
      'Cohere adapter requires either a client instance or apiKey. ' +
      'Install cohere-ai: npm install cohere-ai'
    );
  }

  const client = config.client as CohereClient;
  const defaultModel = config.defaultModel ?? 'command-r-plus';

  return {
    provider: 'cohere',
    providerName: 'Cohere',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('cohere', 'Client not initialized');
      }

      const model = request.model || defaultModel;

      const response = await client.chat({
        model,
        message: request.prompt,
        preamble: request.system,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stopSequences: request.stop
      });

      const text = response.text ?? '';
      const tokens = response.meta?.tokens?.outputTokens ?? estimateTokens(text);
      const totalTokens = response.meta?.tokens 
        ? (response.meta.tokens.inputTokens ?? 0) + (response.meta.tokens.outputTokens ?? 0)
        : undefined;

      return {
        text,
        tokens,
        totalTokens,
        model,
        finishReason: normalizeFinishReason(response.finishReason),
        raw: response
      };
    },

    async embed(input: string | string[]): Promise<number[][]> {
      if (!client?.embed) {
        throw new AdapterConfigError('cohere', 'Embeddings not available');
      }

      const texts = Array.isArray(input) ? input : [input];
      const response = await client.embed({ texts, model: 'embed-english-v3.0' });
      return response.embeddings;
    }
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function normalizeFinishReason(reason?: string): LlmResponse['finishReason'] {
  if (!reason) return undefined;
  return reason === 'COMPLETE' ? 'stop' : reason === 'MAX_TOKENS' ? 'length' : reason;
}
