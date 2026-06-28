import type { Prisma, ProfileStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "../../config/env";
import prisma from "../../shared/db/prisma";
import {
  GeminiPersonaExtractor,
  type PersonaExtractor,
} from "../../shared/ai/persona.extractor";
import { AppError, NotFoundError, ValidationError } from "../../shared/errors";
import {
  ALL_VOCABULARY_SLUGS,
  getTaxonomyEntry,
  TAXONOMY_CATEGORIES,
  TAXONOMY_ENTRIES,
} from "./taxonomy";
import type {
  OwnProfileView,
  ProfileResponse,
  ProfileTag,
  PublicProfileResponse,
  PublicProfileView,
} from "./profiles.types";

type UserProfileRecord = {
  userId: string;
  story: string | null;
  summary: string | null;
  tags: string[];
  aiTags: string[];
  suggestedTags: string[];
  traits: unknown;
  status: ProfileStatus;
  parsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaClientLike = {
  user: {
    findUnique: (args: { where: { id: string }; select: { id: true } }) => Promise<{
      id: string;
    } | null>;
  };
  userProfile: {
    findUnique: (args: { where: { userId: string } }) => Promise<UserProfileRecord | null>;
    upsert: (args: {
      where: { userId: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<UserProfileRecord>;
    update: (args: {
      where: { userId: string };
      data: Record<string, unknown>;
    }) => Promise<UserProfileRecord>;
  };
};

const storedTagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  category: z.enum(TAXONOMY_CATEGORIES),
  confidence: z.number(),
});

const clampConfidence = (confidence: number) =>
  Math.max(0, Math.min(1, Number.isFinite(confidence) ? confidence : 0));

const dedupe = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const parseStoredTags = (value: unknown): ProfileTag[] => {
  const parsed = z.array(storedTagSchema).safeParse(value);
  if (!parsed.success) {
    return [];
  }

  return parsed.data.map((tag) => ({
    ...tag,
    confidence: clampConfidence(tag.confidence),
  }));
};

const buildTag = (slug: string, confidence: number): ProfileTag | null => {
  const taxonomyEntry = getTaxonomyEntry(slug);
  if (!taxonomyEntry) {
    return null;
  }

  return {
    slug,
    label: taxonomyEntry.label,
    category: taxonomyEntry.category,
    confidence: clampConfidence(confidence),
  };
};

const toJsonValue = (tags: ProfileTag[]) =>
  tags as unknown as Prisma.InputJsonValue;

export class ProfilesRepository {
  constructor(
    private readonly db: PrismaClientLike = prisma as unknown as PrismaClientLike,
    private extractor: PersonaExtractor | null = null,
  ) {}

  private resolveExtractor() {
    if (this.extractor) {
      return this.extractor;
    }

    this.extractor = new GeminiPersonaExtractor({
      model: env.PERSONA_AI_MODEL,
      vocabulary: TAXONOMY_ENTRIES,
    });

    return this.extractor;
  }

  private toOwnProfileView(profile: UserProfileRecord): OwnProfileView {
    const storedTags = parseStoredTags(profile.traits);
    const fallbackConfirmedTags = profile.tags
      .map((slug) => buildTag(slug, 1))
      .filter((tag): tag is ProfileTag => Boolean(tag));

    return {
      userId: profile.userId,
      story: profile.story,
      summary: profile.summary,
      status: profile.status,
      tags:
        storedTags.length > 0
          ? storedTags
          : profile.status === "READY"
            ? fallbackConfirmedTags
            : [],
      confirmedTagSlugs: profile.tags,
      aiTagSlugs: profile.aiTags,
      suggestedTags: profile.suggestedTags,
      parsedAt: profile.parsedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toPublicProfileView(profile: UserProfileRecord): PublicProfileView {
    const ownView = this.toOwnProfileView(profile);
    return {
      userId: ownView.userId,
      summary: ownView.summary,
      tags: ownView.tags,
      updatedAt: ownView.updatedAt,
    };
  }

  private buildConfirmedTags(slugs: string[], existingTraits: ProfileTag[]) {
    const existingBySlug = new Map(existingTraits.map((tag) => [tag.slug, tag] as const));

    return dedupe(slugs)
      .map((slug) => buildTag(slug, existingBySlug.get(slug)?.confidence ?? 1))
      .filter((tag): tag is ProfileTag => Boolean(tag));
  }

  private buildPreviewTags(
    tags: Array<{ slug: string; category: string; confidence: number }>,
  ) {
    const previewBySlug = new Map<string, ProfileTag>();

    for (const tag of tags) {
      const previewTag = buildTag(tag.slug, tag.confidence);
      if (!previewTag || previewBySlug.has(previewTag.slug)) {
        continue;
      }

      previewBySlug.set(previewTag.slug, previewTag);
    }

    return Array.from(previewBySlug.values());
  }

  private async ensureUserExists(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }
  }

  private async markFailedProfile(userId: string, story: string) {
    const now = new Date();

    await this.db.userProfile.upsert({
      where: { userId },
      update: {
        story,
        summary: null,
        tags: [],
        aiTags: [],
        suggestedTags: [],
        traits: null,
        status: "FAILED",
        provider: "gemini",
        model: env.PERSONA_AI_MODEL,
        parsedAt: null,
        updatedAt: now,
      },
      create: {
        userId,
        story,
        summary: null,
        tags: [],
        aiTags: [],
        suggestedTags: [],
        traits: null,
        status: "FAILED",
        provider: "gemini",
        model: env.PERSONA_AI_MODEL,
        parsedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async submitStory(userId: string, story: string): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    if (!env.PERSONA_AI_ENABLED) {
      throw new AppError("Persona profiling is disabled.", 503);
    }

    try {
      const extracted = await this.resolveExtractor().extractPersona(story);
      const previewTags = this.buildPreviewTags(extracted.tags);
      const aiTagSlugs = previewTags.map((tag) => tag.slug);
      const suggestedTags = dedupe([
        ...extracted.suggestedTags,
        ...extracted.tags
          .filter((tag) => !ALL_VOCABULARY_SLUGS.includes(tag.slug))
          .map((tag) => tag.slug),
      ]);
      const now = new Date();

      const profile = await this.db.userProfile.upsert({
        where: { userId },
        update: {
          story,
          summary: extracted.summary,
          tags: [],
          aiTags: aiTagSlugs,
          suggestedTags,
          traits: toJsonValue(previewTags),
          status: "AWAITING_REVIEW",
          provider: "gemini",
          model: env.PERSONA_AI_MODEL,
          parsedAt: now,
          updatedAt: now,
        },
        create: {
          userId,
          story,
          summary: extracted.summary,
          tags: [],
          aiTags: aiTagSlugs,
          suggestedTags,
          traits: toJsonValue(previewTags),
          status: "AWAITING_REVIEW",
          provider: "gemini",
          model: env.PERSONA_AI_MODEL,
          parsedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      return { success: true, profile: this.toOwnProfileView(profile) };
    } catch (error) {
      await this.markFailedProfile(userId, story);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to parse persona story.", 502);
    }
  }

  async skip(userId: string): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    const now = new Date();
    const profile = await this.db.userProfile.upsert({
      where: { userId },
      update: {
        story: null,
        summary: null,
        tags: [],
        aiTags: [],
        suggestedTags: [],
        traits: null,
        status: "SKIPPED",
        provider: null,
        model: null,
        parsedAt: null,
        updatedAt: now,
      },
      create: {
        userId,
        story: null,
        summary: null,
        tags: [],
        aiTags: [],
        suggestedTags: [],
        traits: null,
        status: "SKIPPED",
        provider: null,
        model: null,
        parsedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return { success: true, profile: this.toOwnProfileView(profile) };
  }

  async confirmTags(userId: string, tags: string[]): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    const profile = await this.db.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError("Profile not found.");
    }

    if (
      profile.status === "PENDING" ||
      profile.status === "FAILED" ||
      profile.status === "SKIPPED"
    ) {
      throw new ValidationError("Submit a story before confirming tags.");
    }

    const normalizedTags = dedupe(tags.map((tag) => tag.trim().toLowerCase()));
    const invalidTags = normalizedTags.filter((tag) => !getTaxonomyEntry(tag));

    if (invalidTags.length > 0) {
      throw new ValidationError("Some tags are not in the allowed vocabulary.", invalidTags);
    }

    const confirmedTags = this.buildConfirmedTags(normalizedTags, parseStoredTags(profile.traits));
    const updated = await this.db.userProfile.update({
      where: { userId },
      data: {
        tags: confirmedTags.map((tag) => tag.slug),
        traits: toJsonValue(confirmedTags),
        status: "READY",
      },
    });

    return { success: true, profile: this.toOwnProfileView(updated) };
  }

  async getMine(userId: string): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    const profile = await this.db.userProfile.findUnique({
      where: { userId },
    });

    return {
      success: true,
      profile: profile ? this.toOwnProfileView(profile) : null,
    };
  }

  async getPublic(userId: string): Promise<PublicProfileResponse> {
    const profile = await this.db.userProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.status !== "READY") {
      throw new NotFoundError("Profile not found.");
    }

    return {
      success: true,
      profile: this.toPublicProfileView(profile),
    };
  }
}
