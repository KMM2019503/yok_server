import { describe, expect, it } from "bun:test";
import { UsersService } from "../../modules/users/users.service";

describe("UsersService", () => {
  it("delegates update to repository", async () => {
    let called = false;
    const repository = {
      update: async (_userId: string, _body: Record<string, unknown>) => {
        called = true;
        return { success: true };
      },
    };

    const service = new UsersService(repository as never);
    const response = await service.update({
      userId: "u1",
      body: { userName: "new" },
    });

    expect(called).toBeTrue();
    expect(response).toEqual({ success: true });
  });
});
