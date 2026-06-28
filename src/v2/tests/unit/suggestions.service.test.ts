import { describe, expect, it } from "bun:test";
import { SuggestionsService } from "../../modules/suggestions/suggestions.service";

describe("SuggestionsService", () => {
  it("delegates listFriendSuggestions to repository", async () => {
    let received: unknown;
    const repository = {
      listFriendSuggestions: (userId: string, limit?: number) => {
        received = { userId, limit };
        return Promise.resolve({ success: true, suggestions: [] });
      },
    };

    const service = new SuggestionsService(repository as never);
    const response = await service.listFriendSuggestions({
      userId: "u1",
      limit: 8,
    });

    expect(received).toEqual({ userId: "u1", limit: 8 });
    expect(response).toEqual({ success: true, suggestions: [] });
  });
});
