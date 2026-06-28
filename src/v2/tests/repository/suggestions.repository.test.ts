import { describe, expect, it } from "bun:test";
import { NotFoundError } from "../../shared/errors";
import { SuggestionsRepository } from "../../modules/suggestions/suggestions.repository";

describe("SuggestionsRepository", () => {
  it("returns ranked suggestions based on shared tags", async () => {
    const repository = new SuggestionsRepository({
      user: {
        findUnique: () =>
          Promise.resolve({
            id: "me",
            blockedUserIds: ["blocked-by-me"],
          }),
        findMany: () =>
          Promise.resolve([
            { id: "blocked-me" },
          ]),
      },
      userProfile: {
        findUnique: () =>
          Promise.resolve({
            userId: "me",
            tags: ["developer", "football", "anime"],
            status: "READY",
          }),
        findMany: () =>
          Promise.resolve([
            {
              userId: "candidate-1",
              story: "I build products, follow anime, and unwind with coffee.",
              summary: "Builds products and watches anime.",
              tags: ["developer", "anime", "coffee-lover"],
              updatedAt: new Date("2026-06-29T10:00:00.000Z"),
              user: {
                id: "candidate-1",
                userName: "Aye Aye",
                email: "aye@example.com",
                userUniqueID: "AA#1001",
                profilePictureUrl: null,
                lastActiveAt: new Date("2026-06-29T11:00:00.000Z"),
              },
            },
            {
              userId: "candidate-2",
              story: "Weekend football keeps me happy, and I love exploring new places.",
              summary: "Loves football on weekends.",
              tags: ["football", "traveler"],
              updatedAt: new Date("2026-06-29T09:00:00.000Z"),
              user: {
                id: "candidate-2",
                userName: "Ko Ko",
                email: "ko@example.com",
                userUniqueID: "KK#1002",
                profilePictureUrl: null,
                lastActiveAt: new Date("2026-06-29T12:00:00.000Z"),
              },
            },
          ]),
      },
      friendship: {
        findMany: () => Promise.resolve([{ friendId: "already-friend" }]),
      },
      friendRequest: {
        findMany: () =>
          Promise.resolve([
            { senderId: "me", receiverId: "pending-outgoing" },
            { senderId: "pending-incoming", receiverId: "me" },
          ]),
      },
    } as never);

    const response = await repository.listFriendSuggestions("me", 10);

    expect(response.success).toBe(true);
    expect(response.suggestions).toHaveLength(2);
    expect(response.suggestions[0]).toMatchObject({
      id: "candidate-1",
      story: "I build products, follow anime, and unwind with coffee.",
      tags: [
        { slug: "developer", label: "Developer", category: "profession" },
        { slug: "anime", label: "Anime", category: "media" },
        { slug: "coffee-lover", label: "Coffee Lover", category: "lifestyle" },
      ],
      sharedTagCount: 2,
      sharedTags: [
        { slug: "developer", label: "Developer", category: "profession" },
        { slug: "anime", label: "Anime", category: "media" },
      ],
    });
    expect(response.suggestions[1]).toMatchObject({
      id: "candidate-2",
      story: "Weekend football keeps me happy, and I love exploring new places.",
      tags: [
        { slug: "football", label: "Football", category: "sport" },
        { slug: "traveler", label: "Traveler", category: "lifestyle" },
      ],
      sharedTagCount: 1,
    });
  });

  it("returns no suggestions when the caller profile is not ready", async () => {
    const repository = new SuggestionsRepository({
      user: {
        findUnique: () =>
          Promise.resolve({
            id: "me",
            blockedUserIds: [],
          }),
        findMany: () => Promise.resolve([]),
      },
      userProfile: {
        findUnique: () =>
          Promise.resolve({
            userId: "me",
            tags: [],
            status: "PENDING",
          }),
        findMany: () => Promise.resolve([]),
      },
      friendship: {
        findMany: () => Promise.resolve([]),
      },
      friendRequest: {
        findMany: () => Promise.resolve([]),
      },
    } as never);

    const response = await repository.listFriendSuggestions("me", 5);

    expect(response).toEqual({ success: true, suggestions: [] });
  });

  it("throws when the caller does not exist", async () => {
    const repository = new SuggestionsRepository({
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
      },
      userProfile: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
      },
      friendship: {
        findMany: () => Promise.resolve([]),
      },
      friendRequest: {
        findMany: () => Promise.resolve([]),
      },
    });

    try {
      await repository.listFriendSuggestions("missing", 5);
      throw new Error("Expected listFriendSuggestions to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });
});
