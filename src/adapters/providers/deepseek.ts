/**
 * DeepSeek Adapter
 * 
 * Adapter for DeepSeek API (OpenAI-compatible)
 * 
 * @module adapters/providers/deepseek
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * DeepSeek uses OpenAI-compatible API.
 */
interface DeepSeekClient {
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
}

/**
 * Builds a DeepSeek adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for DeepSeek
 * 
 * @example
 * // DeepSeek uses OpenAI SDK with custom base URL
 * import OpenAI from 'openai';
 * const deepseek = new OpenAI({ 
 *   apiKey: process.env.DEEPSEEK_API_KEY,
 *   baseURL: 'https://api.deepseek.com/v1'
 * });
 * const llm = buildDeepSeekAdapter({ provider: 'deepseek', client: deepseek });
 */
export function buildDeepSeekAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'deepseek',
      'DeepSeek adapter requires either a client instance or apiKey. ' +
      'Use OpenAI SDK with baseURL: https://api.deepseek.com/v1'
    );
  }

  const client = config.client as DeepSeekClient;
  const defaultModel = config.defaultModel ?? 'deepseek-chat';

  return {
    provider: 'deepseek',
    providerName: 'DeepSeek',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('deepseek', 'Client not initialized');
      }

      const model = request.model || defaultModel;
      
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

      return {
        text,
        tokens,
        totalTokens: response.usage?.total_tokens,
        model: response.model ?? model,
        finishReason: normalizeFinishReason(choice?.finish_reason),
        raw: response
      };
    }
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function normalizeFinishReason(reason?: string): LlmResponse['finishReason'] {
  if (!reason) return undefined;
  return reason === 'stop' ? 'stop' : reason === 'length' ? 'length' : reason;
}
