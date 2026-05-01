import {
  getAllConversationsService,
  getConversationMessagesService,
  getLatestMessagesInConversationsService,
} from "../../services/conversation.services.js";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";

export class ConversationsRepository {
  getAll(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      query,
    });

    return getAllConversationsService(request);
  }

  getMessages(
    userId: string,
    conversationId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      params: { conversationId },
      query,
    });

    return getConversationMessagesService(request);
  }

  getLatestMessages(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      query,
    });

    return getLatestMessagesInConversationsService(
      request,
    );
  }
}
