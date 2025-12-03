/**
 * Google Adapter
 * 
 * Adapter for Google AI (Gemini models)
 * 
 * @module adapters/providers/google
 * @author Haiec
 * @license MIT
 */

import { LlmClient, LlmRequest, LlmResponse, AdapterConfig, AdapterConfigError } from '../types';

/**
 * Google Generative AI client interface.
 */
interface GoogleClient {
  getGenerativeModel(params: { model: string }): {
    generateContent(prompt: string | { contents: Array<{ role: string; parts: Array<{ text: string }> }> }): Promise<{
      response: {
        text(): string;
        usageMetadata?: {
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };
    }>;
  };
}

/**
 * Builds a Google AI adapter.
 * 
 * @param config - Adapter configuration
 * @returns LLM client for Google AI
 * 
 * @example
 * import { GoogleGenerativeAI } from '@google/generative-ai';
 * const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
 * const llm = buildGoogleAdapter({ provider: 'google', client: genAI });
 */
export function buildGoogleAdapter(config: AdapterConfig): LlmClient {
  if (!config.client && !config.apiKey) {
    throw new AdapterConfigError(
      'google',
      'Google adapter requires either a client instance or apiKey. ' +
      'Install @google/generative-ai: npm install @google/generative-ai'
    );
  }

  const client = config.client as GoogleClient;
  const defaultModel = config.defaultModel ?? 'gemini-1.5-flash';

  return {
    provider: 'google',
    providerName: 'Google AI',

    async generate(request: LlmRequest): Promise<LlmResponse> {
      if (!client) {
        throw new AdapterConfigError('google', 'Client not initialized');
      }

      const modelName = request.model || defaultModel;
      const model = client.getGenerativeModel({ model: modelName });

      // Build prompt with system instruction if provided
      let prompt: string;
      if (request.system) {
        prompt = `${request.system}\n\n${request.prompt}`;
      } else {
        prompt = request.prompt;
      }

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      const tokens = response.usageMetadata?.candidatesTokenCount ?? estimateTokens(text);
      const totalTokens = response.usageMetadata?.totalTokenCount;

      return {
        text,
        tokens,
        totalTokens,
        model: modelName,
        finishReason: 'stop',
        raw: result
      };
    }
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}
