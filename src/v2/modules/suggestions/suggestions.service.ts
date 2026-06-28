import type { SuggestionsRepository } from "./suggestions.repository";
import type {
  FriendSuggestionsResponse,
  ListFriendSuggestionsInput,
} from "./suggestions.types";

export class SuggestionsService {
  constructor(private readonly repository: SuggestionsRepository) {}

  listFriendSuggestions(
    input: ListFriendSuggestionsInput,
  ): Promise<FriendSuggestionsResponse> {
    return this.repository.listFriendSuggestions(input.userId, input.limit);
  }
}
