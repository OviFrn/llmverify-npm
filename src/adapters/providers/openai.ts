/**
 * OpenAI Adapter
 * 
 * Adapter for OpenAI API (GPT-4, GPT-3.5, etc.)
 * 
 * @module adapters/providers/openai
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * OpenAI SDK client interface (minimal typing for compatibility).
 */
interface OpenAIClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
        stop?: string[];
      }): Promise<{
        choices: Array<{
          message?: { content?: string | null };
          finish_reason?: string;
        }>;
        usage?: {
          completion_tokens?: number;
          total_tokens?: number;
        };
        model?: string;
      }>;
    };
  };
  embeddings?: {
    create(params: { model: string; input: string | string[] }): Promise<{
      data: Array<{ embedding: number[] }>;
    }>;
  };
}

/**
 * Builds an OpenAI adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for OpenAI
 * 
 * @example
 * import OpenAI from 'openai';
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const llm = buildOpenAIAdapter({ provider: 'openai', client: openai });
 */
export function buildOpenAIAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'openai',
      'OpenAI adapter requires either a client instance or apiKey. ' +
      'Install openai package: npm install openai'
    );
  }

  const client = config.client as OpenAIClient;
  const defaultModel = config.defaultModel ?? 'gpt-4o-mini';

  return {
    provider: 'openai',
    providerName: 'OpenAI',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('openai', 'Client not initialized');
      }

      const model = request.model || defaultModel;
      
      // Build messages array
      const messages: Array<{ role: string; content: string }> = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push({ role: 'user', content: request.prompt });

      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stop: request.stop
      });

      const choice = response.choices[0];
      const text = choice?.message?.content?.toString() ?? '';
      const tokens = response.usage?.completion_tokens ?? estimateTokens(text);
      const totalTokens = response.usage?.total_tokens;

      return {
        text,
        tokens,
        totalTokens,
        model: response.model ?? model,
        finishReason: normalizeFinishReason(choice?.finish_reason),
        raw: response
      };
    },

    async embed(input: string | string[]): Promise<number[][]> {
      if (!client?.embeddings) {
        throw new AdapterConfigError('openai', 'Embeddings not available');
      }

      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input
      });

      return response.data.map(d => d.embedding);
    }
  };
}

/**
 * Estimates token count from text (rough approximation).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/**
 * Normalizes finish reason to standard format.
 */
function normalizeFinishReason(reason?: string): LlmResponse['finishReason'] {
  if (!reason) return undefined;
  const map: Record<string, LlmResponse['finishReason']> = {
    'stop': 'stop',
    'length': 'length',
    'content_filter': 'content_filter',
    'tool_calls': 'tool_calls',
    'function_call': 'tool_calls'
  };
  return map[reason] ?? reason;
}
