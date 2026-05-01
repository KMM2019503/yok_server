import { describe, expect, it } from "bun:test";
import { AuthRepository } from "../../modules/auth/auth.repository";

describe("AuthRepository", () => {
  it("uses prisma adapter for find and create", async () => {
    const calls: string[] = [];

    const repository = new AuthRepository({
      user: {
        findUnique: async () => {
          calls.push("findUnique");
          return { id: "u1", email: "a@b.com", passwordHash: "hash" };
        },
        create: async () => {
          calls.push("create");
          return { id: "u2", email: "n@b.com", passwordHash: "hash" };
        },
      },
    });

    await repository.findUserByEmail("a@b.com");
    await repository.createUser({
      userName: "new",
      email: "n@b.com",
      passwordHash: "hash",
      userUniqueID: "N#1234",
    });

    expect(calls).toEqual(["findUnique", "create"]);
  });
});
