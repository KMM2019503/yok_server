import type { Gender, ProfileStatus } from "@prisma/client";
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

export type OwnProfileUserView = {
  id: string;
  email: string;
  userName: string;
  userUniqueID: string;
  gender: Gender | null;
  dateOfBirth: Date | null;
  profilePictureUrl: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProfileUserView = {
  id: string;
  userName: string;
  userUniqueID: string;
  profilePictureUrl: string | null;
  lastActiveAt: Date | null;
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

export type UpdateMyProfileBody = {
  userName?: string;
  email?: string;
  profilePictureUrl?: string | null;
  gender?: Gender | null;
  dob?: string | null;
  dateOfBirth?: string | null;
  story?: string;
  tags?: string[];
};

export type UpdateOwnUserInput = {
  userName?: string;
  email?: string;
  profilePictureUrl?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
};

export type UpdateMyProfileInput = {
  userId: string;
  body: UpdateMyProfileBody;
};

export type ProfileResponse = {
  success: true;
  user: OwnProfileUserView;
  profile: OwnProfileView | null;
};

export type PublicProfileResponse = {
  success: true;
  user: PublicProfileUserView;
  profile: PublicProfileView;
};
