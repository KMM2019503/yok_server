import type { TaxonomyCategory } from "../profiles/taxonomy";

export type SuggestionTag = {
  slug: string;
  label: string;
  category: TaxonomyCategory;
};

export type FriendSuggestion = {
  id: string;
  userName: string;
  email: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: Date | null;
  story: string | null;
  summary: string | null;
  tags: SuggestionTag[];
  sharedTags: SuggestionTag[];
  sharedTagCount: number;
};

export type ListFriendSuggestionsInput = {
  userId: string;
  limit?: number;
};

export type FriendSuggestionsResponse = {
  success: true;
  suggestions: FriendSuggestion[];
};
