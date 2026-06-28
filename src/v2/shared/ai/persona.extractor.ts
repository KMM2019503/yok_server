import { z } from "zod";
import type { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";
import { getGeminiClient } from "./gemini";

export type PersonaVocabularyEntry = {
  slug: string;
  label: string;
  category: string;
};

export type ExtractedPersonaTag = {
  slug: string;
  category: string;
  confidence: number;
};

export type ExtractPersonaResult = {
  summary: string;
  tags: ExtractedPersonaTag[];
  suggestedTags: string[];
};

export interface PersonaExtractor {
  extractPersona(story: string): Promise<ExtractPersonaResult>;
}

const extractorResponseSchema = z.object({
  summary: z.string().trim().min(1),
  tags: z.array(
    z.object({
      slug: z.string().trim().min(1),
      category: z.string().trim().min(1),
      confidence: z.number().min(0).max(1),
    }),
  ),
  suggestedTags: z.array(z.string().trim().min(1)).default([]),
});

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const dedupeStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const buildSystemInstruction = (vocabulary: PersonaVocabularyEntry[]) => {
  const grouped = vocabulary.reduce<Record<string, PersonaVocabularyEntry[]>>(
    (accumulator, entry) => {
      accumulator[entry.category] ??= [];
      accumulator[entry.category].push(entry);
      return accumulator;
    },
    {},
  );

  const vocabularyBlock = Object.entries(grouped)
    .map(([category, entries]) => {
      const list = entries.map((entry) => `${entry.slug} (${entry.label})`).join(", ");
      return `- ${category}: ${list}`;
    })
    .join("\n");

  return [
    "You extract persona tags from a user's self-description.",
    "Return JSON only.",
    "Write a one-sentence summary.",
    "Only put allowed vocabulary slugs into tags[].slug.",
    "Use suggestedTags for useful off-vocabulary concepts as lowercase kebab-case slugs.",
    "Confidence must be a number between 0 and 1.",
    "Match each chosen slug to its correct category.",
    "Do not invent extra fields.",
    "",
    "Allowed vocabulary:",
    vocabularyBlock,
  ].join("\n");
};

export class GeminiPersonaExtractor implements PersonaExtractor {
  private readonly instruction: string;

  constructor(
    private readonly options: {
      ai?: GoogleGenAI;
      model?: string;
      vocabulary: PersonaVocabularyEntry[];
    },
  ) {
    this.instruction = buildSystemInstruction(options.vocabulary);
  }

  async extractPersona(story: string): Promise<ExtractPersonaResult> {
    const ai = this.options.ai ?? getGeminiClient();
    const response = await ai.models.generateContent({
      model: this.options.model ?? env.PERSONA_AI_MODEL,
      contents: story,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        systemInstruction: this.instruction,
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: {
                    type: "string",
                    enum: this.options.vocabulary.map((entry) => entry.slug),
                  },
                  category: {
                    type: "string",
                    enum: Array.from(
                      new Set(this.options.vocabulary.map((entry) => entry.category)),
                    ),
                  },
                  confidence: {
                    type: "number",
                  },
                },
                required: ["slug", "category", "confidence"],
              },
            },
            suggestedTags: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["summary", "tags", "suggestedTags"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedJson: unknown = JSON.parse(response.text);
    const parsed = extractorResponseSchema.parse(parsedJson);

    return {
      summary: parsed.summary,
      tags: dedupeStrings(parsed.tags.map((tag) => tag.slug)).map((slug) => {
        const match = parsed.tags.find((tag) => tag.slug === slug);
        return {
          slug,
          category: match?.category ?? "",
          confidence: match?.confidence ?? 0,
        };
      }),
      suggestedTags: dedupeStrings(parsed.suggestedTags.map(slugify)),
    };
  }
}
