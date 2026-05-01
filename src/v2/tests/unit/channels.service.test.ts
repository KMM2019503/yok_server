import { describe, expect, it } from "bun:test";
import { ChannelsService } from "../../modules/channels/channels.service";

describe("ChannelsService", () => {
  it("delegates create to repository", async () => {
    const repository = {
      create: async (_userId: string, _body: Record<string, unknown>) => ({
        success: true,
      }),
    };

    const service = new ChannelsService(repository as never);
    const response = await service.create({
      userId: "u1",
      body: { name: "Team" },
    });

    expect(response).toEqual({ success: true });
  });
});
