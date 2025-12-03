/**
 * Anthropic Adapter
 * 
 * Adapter for Anthropic API (Claude models)
 * 
 * @module adapters/providers/anthropic
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Anthropic SDK client interface (minimal typing for compatibility).
 */
interface AnthropicClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string }>;
      system?: string;
      temperature?: number;
      stop_sequences?: string[];
    }): Promise<{
      content: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      model?: string;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    }>;
  };
}

/**
 * Builds an Anthropic adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for Anthropic
 * 
 * @example
 * import Anthropic from '@anthropic-ai/sdk';
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * const llm = buildAnthropicAdapter({ provider: 'anthropic', client: anthropic });
 */
export function buildAnthropicAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'anthropic',
      'Anthropic adapter requires either a client instance or apiKey. ' +
      'Install @anthropic-ai/sdk: npm install @anthropic-ai/sdk'
    );
  }

  const client = config.client as AnthropicClient;
  const defaultModel = config.defaultModel ?? 'claude-3-5-sonnet-20241022';

  return {
    provider: 'anthropic',
    providerName: 'Anthropic',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('anthropic', 'Client not initialized');
      }

      const model = request.model || defaultModel;

      const response = await client.messages.create({
        model,
        max_tokens: request.maxTokens ?? 4096,
        messages: [{ role: 'user', content: request.prompt }],
        system: request.system,
        temperature: request.temperature,
        stop_sequences: request.stop
      });

      // Extract text from content blocks
      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text ?? '')
        .join('');

      const tokens = response.usage?.output_tokens ?? estimateTokens(text);
      const totalTokens = response.usage 
        ? (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0)
        : undefined;

      return {
        text,
        tokens,
        totalTokens,
        model: response.model ?? model,
        finishReason: normalizeFinishReason(response.stop_reason),
        raw: response
      };
    }
  };
}

/**
 * Estimates token count from text.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/**
 * Normalizes Anthropic finish reason.
 */
function normalizeFinishReason(reason?: string): LlmResponse['finishReason'] {
  if (!reason) return undefined;
  const map: Record<string, LlmResponse['finishReason']> = {
    'end_turn': 'stop',
    'stop_sequence': 'stop',
    'max_tokens': 'length',
    'tool_use': 'tool_calls'
  };
  return map[reason] ?? reason;
}
