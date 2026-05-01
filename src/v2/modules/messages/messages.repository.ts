import {
  sendChannelInvitationService,
  sendChannelMessageCommentService,
  sendChannelMessageService,
  sendDMMessageServiceV2,
  sendGroupMessageService,
} from "../../services/message.services.js";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";

export class MessagesRepository {
  sendDirectMessage(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return sendDMMessageServiceV2(request);
  }

  sendChannelInvitation(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return sendChannelInvitationService(request);
  }

  sendGroupMessage(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return sendGroupMessageService(request);
  }

  sendChannelMessage(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return sendChannelMessageService(request);
  }

  sendChannelMessageComment(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return sendChannelMessageCommentService(request);
  }
}
