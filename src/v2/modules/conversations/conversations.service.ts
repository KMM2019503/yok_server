import type {
  ConversationLatestInput,
  ConversationListInput,
  ConversationMessagesInput,
} from "./conversations.types";
import type { ConversationsRepository } from "./conversations.repository";

export class ConversationsService {
  constructor(private readonly repository: ConversationsRepository) {}

  getAll(input: ConversationListInput): Promise<Record<string, unknown>> {
    return this.repository.getAll(input.userId, input.query);
  }

  getMessages(
    input: ConversationMessagesInput,
  ): Promise<Record<string, unknown>> {
    return this.repository.getMessages(
      input.userId,
      input.conversationId,
      input.query,
    );
  }

  getLatestMessages(
    input: ConversationLatestInput,
  ): Promise<Record<string, unknown>> {
    return this.repository.getLatestMessages(input.userId, input.query);
  }
}
