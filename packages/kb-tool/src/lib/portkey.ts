import { getPortkeyApiKey, getPortkeyVirtualKey } from './settings';

export interface ChatCompletionResponse {
  text: string;
}

interface CallLLMArgs {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const PORTKEY_ENDPOINT = 'https://api.portkey.ai/v1/chat/completions';
const DEFAULT_MODEL = '@openrouter/anthropic/claude-sonnet-4-5';

export async function callLLM(args: CallLLMArgs): Promise<ChatCompletionResponse> {
  const apiKey = getPortkeyApiKey();
  if (!apiKey) {
    throw new Error('Portkey API key is not set. Open Settings.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-portkey-api-key': apiKey,
  };

  const virtualKey = getPortkeyVirtualKey();
  if (virtualKey) {
    headers['x-portkey-virtual-key'] = virtualKey;
  }

  const response = await fetch(PORTKEY_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: args.model ?? DEFAULT_MODEL,
      max_tokens: args.maxTokens ?? 8192,
      temperature: args.temperature ?? 0.1,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Portkey API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new Error('Portkey returned no content');
  }

  return { text };
}
