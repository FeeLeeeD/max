import { callLLM } from './portkey';
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from '@/prompts/extraction';

export async function extract(
  anonymizedText: string,
  additionalInstructions?: string,
): Promise<string> {
  const { text } = await callLLM({
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userPrompt: buildExtractionUserPrompt(anonymizedText, additionalInstructions),
    maxTokens: 8192,
  });

  const cleaned = stripCodeFence(text.trim()).trim();

  if (!cleaned.startsWith('# ')) {
    throw new Error(
      `Extraction did not produce valid markdown — got: ${cleaned.slice(0, 100)}`,
    );
  }

  return cleaned;
}

// LLMs sometimes wrap their answer in a top-level markdown fence even when
// told not to. Strip a single outer ```markdown … ``` or ``` … ``` wrapper.
function stripCodeFence(text: string): string {
  const match = text.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```\s*$/);
  return match ? match[1] : text;
}
