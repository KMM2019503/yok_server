import type {
  ChannelCommentInput,
  ChannelInvitationInput,
  ChannelMessageInput,
  DirectMessageInput,
  GroupMessageInput,
} from "./messages.types";
import type { MessagesRepository } from "./messages.repository";

export class MessagesService {
  constructor(private readonly repository: MessagesRepository) {}

  sendDirectMessage(input: DirectMessageInput): Promise<Record<string, unknown>> {
    return this.repository.sendDirectMessage(input.userId, input.body);
  }

  sendChannelInvitation(
    input: ChannelInvitationInput,
  ): Promise<Record<string, unknown>> {
    return this.repository.sendChannelInvitation(input.userId, input.body);
  }

  sendGroupMessage(input: GroupMessageInput): Promise<Record<string, unknown>> {
    return this.repository.sendGroupMessage(input.userId, input.body);
  }

  sendChannelMessage(
    input: ChannelMessageInput,
  ): Promise<Record<string, unknown>> {
    return this.repository.sendChannelMessage(input.userId, input.body);
  }

  sendChannelComment(
    input: ChannelCommentInput,
  ): Promise<Record<string, unknown>> {
    return this.repository.sendChannelMessageComment(input.userId, input.body);
  }
}
