import { describe, expect, it } from "bun:test";
import { ProfilesService } from "../../modules/profiles/profiles.service";

describe("ProfilesService", () => {
  it("delegates submitStory to repository", async () => {
    let received: unknown;
    const repository = {
      submitStory: (userId: string, story: string) => {
        received = { userId, story };
        return Promise.resolve({ success: true, profile: null });
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
        return Promise.resolve({ success: true, profile: null });
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
        return Promise.resolve({ success: true, profile: null });
      },
    };

    const service = new ProfilesService(repository as never);
    await service.skip({ userId: "u1" });

    expect(received).toEqual({ userId: "u1" });
  });
});
