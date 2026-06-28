import { describe, expect, it } from "bun:test";
import { ProfilesService } from "../../modules/profiles/profiles.service";

const successResponse = {
  success: true as const,
  user: {
    id: "u1",
    email: "user@example.com",
    userName: "Pulse User",
    userUniqueID: "P#1001",
    gender: "M" as const,
    dateOfBirth: null,
    profilePictureUrl: null,
    lastActiveAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  profile: null,
};

describe("ProfilesService", () => {
  it("delegates submitStory to repository", async () => {
    let received: unknown;
    const repository = {
      submitStory: (userId: string, story: string) => {
        received = { userId, story };
        return Promise.resolve(successResponse);
      },
    };

    const service = new ProfilesService(repository as never);
    await service.submitStory({
      userId: "u1",
      story: "I build products and love football.",
    });

    expect(received).toEqual({
      userId: "u1",
      story: "I build products and love football.",
    });
  });

  it("delegates confirmTags to repository", async () => {
    let received: unknown;
    const repository = {
      confirmTags: (userId: string, tags: string[]) => {
        received = { userId, tags };
        return Promise.resolve(successResponse);
      },
    };

    const service = new ProfilesService(repository as never);
    await service.confirmTags({
      userId: "u1",
      tags: ["developer", "football"],
    });

    expect(received).toEqual({
      userId: "u1",
      tags: ["developer", "football"],
    });
  });

  it("delegates skip to repository", async () => {
    let received: unknown;
    const repository = {
      skip: (userId: string) => {
        received = { userId };
        return Promise.resolve(successResponse);
      },
    };

    const service = new ProfilesService(repository as never);
    await service.skip({ userId: "u1" });

    expect(received).toEqual({ userId: "u1" });
  });

  it("updates user info, story, and tags through the unified profile flow", async () => {
    const calls: string[] = [];
    const repository = {
      updateUserInfo: (userId: string, body: Record<string, unknown>) => {
        calls.push(`user:${userId}:${JSON.stringify(body)}`);
        return Promise.resolve(successResponse.user);
      },
      submitStory: (userId: string, story: string) => {
        calls.push(`story:${userId}:${story}`);
        return Promise.resolve(successResponse);
      },
      confirmTags: (userId: string, tags: string[]) => {
        calls.push(`tags:${userId}:${tags.join(",")}`);
        return Promise.resolve(successResponse);
      },
      getMine: (userId: string) => {
        calls.push(`get:${userId}`);
        return Promise.resolve(successResponse);
      },
    };

    const service = new ProfilesService(repository as never);
    await service.updateMine({
      userId: "u1",
      body: {
        userName: "Updated User",
        dateOfBirth: "1995-04-12",
        story: "I build products and love football.",
        tags: ["developer", "football"],
      },
    });

    expect(calls).toEqual([
      'user:u1:{"userName":"Updated User","dateOfBirth":"1995-04-12"}',
      "story:u1:I build products and love football.",
      "tags:u1:developer,football",
      "get:u1",
    ]);
  });

  it("maps legacy dob into the unified user update payload", async () => {
    let received: unknown;
    const repository = {
      updateUserInfo: (_userId: string, body: Record<string, unknown>) => {
        received = body;
        return Promise.resolve(successResponse.user);
      },
      getMine: () => Promise.resolve(successResponse),
    };

    const service = new ProfilesService(repository as never);
    await service.updateMine({
      userId: "u1",
      body: {
        dob: "1990-01-01",
      },
    });

    expect(received).toEqual({
      userName: undefined,
      email: undefined,
      profilePictureUrl: undefined,
      gender: undefined,
      dateOfBirth: "1990-01-01",
    });
  });
});
