/**
 * Mistral Adapter
 * 
 * Adapter for Mistral AI API
 * 
 * @module adapters/providers/mistral
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Mistral client interface.
 */
interface MistralClient {
  chat(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
  }): Promise<{
    choices: Array<{
      message?: { content?: string };
      finishReason?: string;
    }>;
    usage?: {
      completionTokens?: number;
      totalTokens?: number;
    };
    model?: string;
  }>;
}

/**
 * Builds a Mistral adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for Mistral
 * 
 * @example
 * import { Mistral } from '@mistralai/mistralai';
 * const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
 * const llm = buildMistralAdapter({ provider: 'mistral', client: mistral });
 */
export function buildMistralAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'mistral',
      'Mistral adapter requires either a client instance or apiKey. ' +
      'Install @mistralai/mistralai: npm install @mistralai/mistralai'
    );
  }

  const client = config.client as MistralClient;
  const defaultModel = config.defaultModel ?? 'mistral-large-latest';

  return {
    provider: 'mistral',
    providerName: 'Mistral AI',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('mistral', 'Client not initialized');
      }

      const model = request.model || defaultModel;
      
      const messages: Array<{ role: string; content: string }> = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push({ role: 'user', content: request.prompt });

      const response = await client.chat({
        model,
        messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stop: request.stop
      });

      const choice = response.choices[0];
      const text = choice?.message?.content ?? '';
      const tokens = response.usage?.completionTokens ?? estimateTokens(text);

      return {
        text,
        tokens,
        totalTokens: response.usage?.totalTokens,
        model: response.model ?? model,
        finishReason: normalizeFinishReason(choice?.finishReason),
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
