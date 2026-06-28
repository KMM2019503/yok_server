import type { ProfileStatus } from "@prisma/client";
import type { TaxonomyCategory } from "./taxonomy";

export type ProfileTag = {
  slug: string;
  label: string;
  category: TaxonomyCategory;
  confidence: number;
};

export type SubmitProfileStoryInput = {
  userId: string;
  story: string;
};

export type ConfirmProfileTagsInput = {
  userId: string;
  tags: string[];
};

export type SkipProfileInput = {
  userId: string;
};

export type OwnProfileView = {
  userId: string;
  story: string | null;
  summary: string | null;
  status: ProfileStatus;
  tags: ProfileTag[];
  confirmedTagSlugs: string[];
  aiTagSlugs: string[];
  suggestedTags: string[];
  parsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProfileView = {
  userId: string;
  summary: string | null;
  tags: ProfileTag[];
  updatedAt: Date;
};

export type ProfileResponse = {
  success: true;
  profile: OwnProfileView | null;
};

export type PublicProfileResponse = {
  success: true;
  profile: PublicProfileView;
};
