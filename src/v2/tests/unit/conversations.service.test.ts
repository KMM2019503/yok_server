import { describe, expect, it } from "bun:test";
import { ConversationsService } from "../../modules/conversations/conversations.service";

describe("ConversationsService", () => {
  it("delegates getAll to repository", async () => {
    const repository = {
      getAll: async () => ({ success: true, conversations: [] }),
    };

    const service = new ConversationsService(repository as never);
    const response = await service.getAll({ userId: "u1", query: {} });

    expect(response).toEqual({ success: true, conversations: [] });
  });
});
