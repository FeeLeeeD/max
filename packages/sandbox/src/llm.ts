import { Portkey } from "portkey-ai";
import { config } from "./config.js";

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

let client: Portkey | null = null;

function getClient(): Portkey {
  if (client) return client;

  const opts: Record<string, string> = {
    apiKey: config.portkeyApiKey,
  };
  if (config.portkeyVirtualKey) {
    opts.virtualKey = config.portkeyVirtualKey;
  }
  if (config.portkeyConfig) {
    opts.config = config.portkeyConfig;
  }

  client = new Portkey(opts);
  return client;
}

const DEFAULT_MODEL = "@openrouter/anthropic/claude-sonnet-4.5";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.2;

export async function generate(
  options: GenerateOptions,
): Promise<GenerationResult> {
  const portkey = getClient();

  try {
    const response = await portkey.chat.completions.create({
      model: options.model ?? DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    if (raw === null || raw === undefined) {
      throw new Error(
        "LLM returned an empty response — no content in choices[0].message.content",
      );
    }

    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const result: GenerationResult = { text };

    if (response.usage) {
      result.inputTokens = response.usage.prompt_tokens;
      result.outputTokens = response.usage.completion_tokens;
    }

    return result;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("LLM returned")) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Portkey API call failed: ${message}`);
  }
}
