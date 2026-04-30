import { describe, expect, it } from "bun:test";
import { MessagesService } from "../../modules/messages/messages.service";

describe("MessagesService", () => {
  it("delegates sendChannelMessage to repository", async () => {
    const repository = {
      sendChannelMessage: async (_userId: string, _body: Record<string, unknown>) => ({
        success: true,
      }),
    };

    const service = new MessagesService(repository as never);
    const response = await service.sendChannelMessage({
      userId: "u1",
      body: { channelId: "c1", content: "hi" },
    });

    expect(response).toEqual({ success: true });
  });
});
