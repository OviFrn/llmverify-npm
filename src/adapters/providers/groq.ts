/**
 * Groq Adapter
 * 
 * Adapter for Groq API (fast inference for Llama, Mixtral, etc.)
 * 
 * @module adapters/providers/groq
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Groq SDK client interface (OpenAI-compatible).
 */
interface GroqClient {
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
 * Builds a Groq adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for Groq
 * 
 * @example
 * import Groq from 'groq-sdk';
 * const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
 * const llm = buildGroqAdapter({ provider: 'groq', client: groq });
 */
export function buildGroqAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'groq',
      'Groq adapter requires either a client instance or apiKey. ' +
      'Install groq-sdk: npm install groq-sdk'
    );
  }

  const client = config.client as GroqClient;
  const defaultModel = config.defaultModel ?? 'llama-3.1-70b-versatile';

  return {
    provider: 'groq',
    providerName: 'Groq',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('groq', 'Client not initialized');
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
  const map: Record<string, LlmResponse['finishReason']> = {
    'stop': 'stop',
    'length': 'length'
  };
  return map[reason] ?? reason;
}
