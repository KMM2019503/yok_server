import { describe, expect, it } from "bun:test";
import { env } from "../../config/env";
import {
  AppError,
  ConflictError,
  ValidationError,
} from "../../shared/errors";
import { ProfilesRepository } from "../../modules/profiles/profiles.repository";

const buildUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "u1",
  email: "user@example.com",
  userName: "Pulse User",
  userUniqueID: "P#1001",
  gender: "M",
  dateOfBirth: new Date("1995-04-12T00:00:00.000Z"),
  profilePictureUrl: "https://example.com/avatar.png",
  lastActiveAt: new Date("2026-06-28T08:00:00.000Z"),
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-15T00:00:00.000Z"),
  ...overrides,
});

describe("ProfilesRepository", () => {
  it("stores preview data from the injected extractor and returns user info", async () => {
    const now = new Date("2026-06-28T12:00:00.000Z");
    let upsertArgs: Record<string, unknown> | undefined;

    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: () => Promise.resolve(buildUser()),
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: (args: Record<string, unknown>) => {
            upsertArgs = args;
            return Promise.resolve({
              userId: "u1",
              story: "I am a developer who loves football.",
              summary: "A developer who enjoys football.",
              tags: [],
              aiTags: ["developer", "football"],
              suggestedTags: ["chess"],
              traits: [
                {
                  slug: "developer",
                  label: "Developer",
                  category: "profession",
                  confidence: 0.9,
                },
                {
                  slug: "football",
                  label: "Football",
                  category: "sport",
                  confidence: 0.8,
                },
              ],
              status: "AWAITING_REVIEW",
              parsedAt: now,
              createdAt: now,
              updatedAt: now,
            });
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      {
        extractPersona: () => Promise.resolve({
          summary: "A developer who enjoys football.",
          tags: [
            { slug: "developer", category: "profession", confidence: 0.9 },
            { slug: "football", category: "sport", confidence: 0.8 },
          ],
          suggestedTags: ["chess"],
        }),
      },
    );

    const originalFlag = env.PERSONA_AI_ENABLED;
    env.PERSONA_AI_ENABLED = true;

    const response = await repository.submitStory(
      "u1",
      "I am a developer who loves football.",
    );

    env.PERSONA_AI_ENABLED = originalFlag;

    expect(upsertArgs).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.user.userName).toBe("Pulse User");
    expect(response.profile?.status).toBe("AWAITING_REVIEW");
    expect(response.profile?.confirmedTagSlugs).toEqual([]);
    expect(response.profile?.aiTagSlugs).toEqual(["developer", "football"]);
    expect(response.profile?.suggestedTags).toEqual(["chess"]);
    expect(response.profile?.tags.map((tag) => tag.slug)).toEqual([
      "developer",
      "football",
    ]);
  });

  it("rejects tags outside the controlled vocabulary", async () => {
    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: () => Promise.resolve(buildUser()),
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve({
            userId: "u1",
            story: "I am a developer.",
            summary: "A developer.",
            tags: [],
            aiTags: ["developer"],
            suggestedTags: [],
            traits: [
              {
                slug: "developer",
                label: "Developer",
                category: "profession",
                confidence: 0.9,
              },
            ],
            status: "AWAITING_REVIEW",
            parsedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          upsert: () => {
            throw new Error("not used");
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      null,
    );

    try {
      await repository.confirmTags("u1", ["developer", "wizard"]);
      throw new Error("Expected confirmTags to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
    }
  });

  it("persists an explicit skipped state", async () => {
    let upsertArgs: Record<string, unknown> | undefined;

    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: () => Promise.resolve(buildUser()),
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: (args: Record<string, unknown>) => {
            upsertArgs = args;
            return Promise.resolve({
              userId: "u1",
              story: null,
              summary: null,
              tags: [],
              aiTags: [],
              suggestedTags: [],
              traits: null,
              status: "SKIPPED",
              parsedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      null,
    );

    const response = await repository.skip("u1");

    expect(upsertArgs).toBeDefined();
    expect(response.user.email).toBe("user@example.com");
    expect(response.profile?.status).toBe("SKIPPED");
    expect(response.profile?.story).toBeNull();
    expect(response.profile?.tags).toEqual([]);
  });

  it("returns user info even when the caller has not created a persona profile yet", async () => {
    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: () => Promise.resolve(buildUser()),
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: () => {
            throw new Error("not used");
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      null,
    );

    const response = await repository.getMine("u1");

    expect(response.user.userUniqueID).toBe("P#1001");
    expect(response.profile).toBeNull();
  });

  it("updates core user fields from the unified profile flow", async () => {
    let updateArgs: Record<string, unknown> | undefined;

    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: (args: { where: { id?: string; email?: string } }) => {
            if ("email" in args.where) {
              return Promise.resolve(null);
            }

            return Promise.resolve(buildUser());
          },
          update: (args: Record<string, unknown>) => {
            updateArgs = args;
            return Promise.resolve(buildUser({
              email: "new@example.com",
              userName: "Updated User",
              gender: null,
              dateOfBirth: null,
              profilePictureUrl: null,
            }));
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: () => {
            throw new Error("not used");
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      null,
    );

    const user = await repository.updateUserInfo("u1", {
      email: "new@example.com",
      userName: "Updated User",
      gender: null,
      dateOfBirth: null,
      profilePictureUrl: null,
    });

    expect(updateArgs).toBeDefined();
    expect(updateArgs?.data).toEqual({
      email: "new@example.com",
      userName: "Updated User",
      gender: null,
      dateOfBirth: null,
      profilePictureUrl: null,
    });
    expect(user.email).toBe("new@example.com");
    expect(user.profilePictureUrl).toBeNull();
  });

  it("rejects unified profile updates when the new email already belongs to another user", async () => {
    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: (args: { where: { id?: string; email?: string } }) => {
            if ("email" in args.where) {
              return Promise.resolve({ id: "u2" });
            }

            return Promise.resolve(buildUser());
          },
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: () => {
            throw new Error("not used");
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      null,
    );

    try {
      await repository.updateUserInfo("u1", {
        email: "taken@example.com",
      });
      throw new Error("Expected updateUserInfo to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
    }
  });

  it("marks the profile as failed when extraction errors", async () => {
    const statuses: string[] = [];

    const repository = new ProfilesRepository(
      {
        user: {
          findUnique: () => Promise.resolve(buildUser()),
          update: () => {
            throw new Error("not used");
          },
        },
        userProfile: {
          findUnique: () => Promise.resolve(null),
          upsert: (args: Record<string, unknown>) => {
            const update = args.update as Record<string, unknown>;
            const create = args.create as Record<string, unknown>;
            statuses.push(String(update.status ?? create.status));
            return Promise.resolve({
              userId: "u1",
              story: "I am a developer.",
              summary: null,
              tags: [],
              aiTags: [],
              suggestedTags: [],
              traits: null,
              status: "FAILED",
              parsedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
          update: () => {
            throw new Error("not used");
          },
        },
      } as never,
      {
        extractPersona: () => Promise.reject(new Error("Gemini unavailable")),
      },
    );

    const originalFlag = env.PERSONA_AI_ENABLED;
    env.PERSONA_AI_ENABLED = true;

    try {
      await repository.submitStory("u1", "I am a developer.");
      throw new Error("Expected submitStory to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }

    env.PERSONA_AI_ENABLED = originalFlag;

    expect(statuses[statuses.length - 1]).toBe("FAILED");
  });
});
