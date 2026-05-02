import { messageServices } from "../../services/message.services";
import type {
  ChannelCommentBody,
  ChannelInvitationBody,
  ChannelMessageBody,
  DirectMessageBody,
  GroupMessageBody,
  MessageServiceResult,
} from "./messages.types";

export class MessagesRepository {
  sendDirectMessage(
    userId: string,
    body: DirectMessageBody,
  ): Promise<MessageServiceResult> {
    return messageServices.sendDirectMessage(userId, body);
  }

  sendChannelInvitation(
    userId: string,
    body: ChannelInvitationBody,
  ): Promise<MessageServiceResult> {
    return messageServices.sendChannelInvitation(userId, body);
  }

  sendGroupMessage(
    userId: string,
    body: GroupMessageBody,
  ): Promise<MessageServiceResult> {
    return messageServices.sendGroupMessage(userId, body);
  }

  sendChannelMessage(
    userId: string,
    body: ChannelMessageBody,
  ): Promise<MessageServiceResult> {
    return messageServices.sendChannelMessage(userId, body);
  }

  sendChannelMessageComment(
    userId: string,
    body: ChannelCommentBody,
  ): Promise<MessageServiceResult> {
    return messageServices.sendChannelComment(userId, body);
  }
}
