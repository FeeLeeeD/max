import type { Replacement } from '@/types';
import { callLLM } from './portkey';
import {
  ANONYMIZATION_SYSTEM_PROMPT,
  buildAnonymizationUserPrompt,
} from '@/prompts/anonymization';

export interface AnonymizationResult {
  anonymizedText: string;
  replacements: Replacement[];
}

const VALID_CATEGORIES: ReadonlySet<Replacement['category']> = new Set([
  'person',
  'company',
  'email',
  'phone',
  'url',
  'id',
  'other',
]);

export async function anonymize(rawText: string): Promise<AnonymizationResult> {
  const { text } = await callLLM({
    systemPrompt: ANONYMIZATION_SYSTEM_PROMPT,
    userPrompt: buildAnonymizationUserPrompt(rawText),
  });

  const parsed = tryParseJson(text);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.anonymized_text !== 'string' ||
    !Array.isArray(parsed.replacements)
  ) {
    throw new Error(
      'LLM response is missing required fields (anonymized_text, replacements).',
    );
  }

  const replacements: Replacement[] = parsed.replacements.map(
    (r: unknown, i: number) => {
      if (!r || typeof r !== 'object') {
        throw new Error(`Replacement #${i} is not an object`);
      }
      const obj = r as Record<string, unknown>;
      if (
        typeof obj.original !== 'string' ||
        typeof obj.replacement !== 'string' ||
        typeof obj.category !== 'string' ||
        !VALID_CATEGORIES.has(obj.category as Replacement['category'])
      ) {
        throw new Error(
          `Replacement #${i} has invalid shape or unknown category: ${JSON.stringify(obj)}`,
        );
      }
      return {
        original: obj.original,
        replacement: obj.replacement,
        category: obj.category as Replacement['category'],
      };
    },
  );

  return {
    anonymizedText: parsed.anonymized_text,
    replacements,
  };
}

// LLMs sometimes wrap JSON in markdown fences or add commentary even when
// asked not to. Try increasingly forgiving strategies before giving up.
function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fall through
    }
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // fall through
    }
  }

  throw new Error('Could not parse LLM response as JSON');
}
