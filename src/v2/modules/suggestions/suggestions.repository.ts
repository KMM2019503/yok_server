import type { ProfileStatus } from "@prisma/client";
import prisma from "../../shared/db/prisma";
import { NotFoundError } from "../../shared/errors";
import { getTaxonomyEntry } from "../profiles/taxonomy";
import type {
  FriendSuggestion,
  FriendSuggestionsResponse,
  SuggestionTag,
} from "./suggestions.types";

type PublicUser = {
  id: string;
  userName: string;
  email: string;
  userUniqueID: string;
  profilePictureUrl: string | null;
  lastActiveAt: Date | null;
};

type MeRecord = {
  id: string;
  blockedUserIds: string[];
};

type MyProfileRecord = {
  userId: string;
  tags: string[];
  status: ProfileStatus;
};

type CandidateProfileRecord = {
  userId: string;
  story: string | null;
  summary: string | null;
  tags: string[];
  updatedAt: Date;
  user: PublicUser;
};

type PrismaClientLike = {
  user: {
    findUnique: (args: {
      where: { id: string };
      select: { id: true; blockedUserIds: true };
    }) => Promise<MeRecord | null>;
    findMany: (args: {
      where: { blockedUserIds: { has: string } };
      select: { id: true };
    }) => Promise<Array<{ id: string }>>;
  };
  userProfile: {
    findUnique: (args: {
      where: { userId: string };
      select: { userId: true; tags: true; status: true };
    }) => Promise<MyProfileRecord | null>;
    findMany: (args: {
      where: {
        userId: { notIn: string[] };
        status: "READY";
        tags: { hasSome: string[] };
      };
      include: {
        user: {
          select: {
            id: true;
            userName: true;
            email: true;
            userUniqueID: true;
            profilePictureUrl: true;
            lastActiveAt: true;
          };
        };
      };
      take: number;
      orderBy: { updatedAt: "desc" };
    }) => Promise<CandidateProfileRecord[]>;
  };
  friendship: {
    findMany: (args: {
      where: { userId: string };
      select: { friendId: true };
    }) => Promise<Array<{ friendId: string }>>;
  };
  friendRequest: {
    findMany: (args: {
      where: {
        status: "PENDING";
        OR: Array<{ senderId: string } | { receiverId: string }>;
      };
      select: { senderId: true; receiverId: true };
    }) => Promise<Array<{ senderId: string; receiverId: string }>>;
  };
};

const publicUserSelect = {
  id: true,
  userName: true,
  email: true,
  userUniqueID: true,
  profilePictureUrl: true,
  lastActiveAt: true,
} as const;

const DEFAULT_LIMIT = 12;
const MAX_FETCH_MULTIPLIER = 5;

const toMillis = (value: Date | null | undefined) => value?.getTime() ?? 0;

const buildSuggestionTags = (tagSlugs: string[]): SuggestionTag[] =>
  tagSlugs.flatMap((slug) => {
    const entry = getTaxonomyEntry(slug);
    return entry
      ? [
          {
            slug: entry.slug,
            label: entry.label,
            category: entry.category,
          },
        ]
      : [];
  });

export class SuggestionsRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async listFriendSuggestions(
    userId: string,
    limit?: number,
  ): Promise<FriendSuggestionsResponse> {
    const [me, myProfile, friendships, pendingRequests, blockers] = await Promise.all([
      this.db.user.findUnique({
        where: { id: userId },
        select: { id: true, blockedUserIds: true },
      }),
      this.db.userProfile.findUnique({
        where: { userId },
        select: { userId: true, tags: true, status: true },
      }),
      this.db.friendship.findMany({
        where: { userId },
        select: { friendId: true },
      }),
      this.db.friendRequest.findMany({
        where: {
          status: "PENDING",
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { senderId: true, receiverId: true },
      }),
      this.db.user.findMany({
        where: { blockedUserIds: { has: userId } },
        select: { id: true },
      }),
    ]);

    if (!me) {
      throw new NotFoundError("User not found.");
    }

    if (!myProfile || myProfile.status !== "READY" || myProfile.tags.length === 0) {
      return { success: true, suggestions: [] };
    }

    const excludedUserIds = new Set<string>([
      userId,
      ...me.blockedUserIds,
      ...friendships.map((friendship) => friendship.friendId),
      ...blockers.map((user) => user.id),
    ]);

    for (const request of pendingRequests) {
      excludedUserIds.add(
        request.senderId === userId ? request.receiverId : request.senderId,
      );
    }

    const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), 50);
    const candidates = await this.db.userProfile.findMany({
      where: {
        userId: { notIn: Array.from(excludedUserIds) },
        status: "READY",
        tags: { hasSome: myProfile.tags },
      },
      include: { user: { select: publicUserSelect } },
      take: take * MAX_FETCH_MULTIPLIER,
      orderBy: { updatedAt: "desc" },
    });

    const myTagSet = new Set(myProfile.tags);
    const suggestions = candidates
      .map<FriendSuggestion | null>((candidate) => {
        const sharedTagSlugs = candidate.tags.filter((tag) => myTagSet.has(tag));
        if (sharedTagSlugs.length === 0) {
          return null;
        }

        return {
          ...candidate.user,
          story: candidate.story,
          summary: candidate.summary,
          tags: buildSuggestionTags(candidate.tags),
          sharedTags: buildSuggestionTags(sharedTagSlugs),
          sharedTagCount: sharedTagSlugs.length,
        };
      })
      .filter((candidate): candidate is FriendSuggestion => Boolean(candidate))
      .sort((left, right) => {
        if (right.sharedTagCount !== left.sharedTagCount) {
          return right.sharedTagCount - left.sharedTagCount;
        }

        return toMillis(right.lastActiveAt) - toMillis(left.lastActiveAt);
      })
      .slice(0, take);

    return { success: true, suggestions };
  }
}
