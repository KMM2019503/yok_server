import { describe, expect, it } from "bun:test";
import { FriendsService } from "../../modules/friends/friends.service";

describe("FriendsService", () => {
  it("delegates sendRequest to repository", async () => {
    let args: [string, string] | undefined;
    const repository = {
      sendRequest: async (userId: string, receiverId: string) => {
        args = [userId, receiverId];
        return { success: true, status: "PENDING" };
      },
    };

    const service = new FriendsService(repository as never);
    const response = await service.sendRequest({
      userId: "u1",
      receiverId: "u2",
    });

    expect(args).toEqual(["u1", "u2"]);
    expect(response).toEqual({ success: true, status: "PENDING" });
  });

  it("delegates accept to repository", async () => {
    let args: [string, string] | undefined;
    const repository = {
      accept: async (userId: string, requestId: string) => {
        args = [userId, requestId];
        return { success: true, status: "FRIENDS" };
      },
    };

    const service = new FriendsService(repository as never);
    const response = await service.accept({ userId: "u1", requestId: "r1" });

    expect(args).toEqual(["u1", "r1"]);
    expect(response).toEqual({ success: true, status: "FRIENDS" });
  });

  it("passes pagination + search through to listFriends", async () => {
    let received: unknown;
    const repository = {
      listFriends: async (
        userId: string,
        page: { cursor?: string; limit?: number },
        q?: string,
      ) => {
        received = { userId, page, q };
        return { success: true, friends: [] };
      },
    };

    const service = new FriendsService(repository as never);
    await service.listFriends({
      userId: "u1",
      cursor: "c1",
      limit: 10,
      q: "ann",
    });

    expect(received).toEqual({
      userId: "u1",
      page: { cursor: "c1", limit: 10 },
      q: "ann",
    });
  });

  it("delegates unfriend to repository", async () => {
    let args: [string, string] | undefined;
    const repository = {
      unfriend: async (userId: string, friendId: string) => {
        args = [userId, friendId];
        return { success: true };
      },
    };

    const service = new FriendsService(repository as never);
    await service.unfriend({ userId: "u1", friendId: "u2" });

    expect(args).toEqual(["u1", "u2"]);
  });
});
