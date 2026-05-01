import type {
  ChannelBodyInput,
  ChannelCreateInput,
  ChannelParamsInput,
  ChannelUpdateInput,
} from "./channels.types";
import type { ChannelsRepository } from "./channels.repository";

export class ChannelsService {
  constructor(private readonly repository: ChannelsRepository) {}

  create(input: ChannelCreateInput): Promise<Record<string, unknown>> {
    return this.repository.create(input.userId, input.body);
  }

  update(input: ChannelUpdateInput): Promise<Record<string, unknown>> {
    return this.repository.update(input.userId, input.channelId, input.body);
  }

  getAll(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.getAll(input.userId);
  }

  getMessages(input: ChannelParamsInput): Promise<Record<string, unknown>> {
    return this.repository.getMessages(
      input.userId,
      input.channelId,
      input.query ?? {},
    );
  }

  addAdmin(input: ChannelUpdateInput): Promise<Record<string, unknown>> {
    return this.repository.addAdmin(input.userId, input.channelId, input.body);
  }

  removeAdmin(input: ChannelUpdateInput): Promise<Record<string, unknown>> {
    return this.repository.removeAdmin(input.userId, input.channelId, input.body);
  }

  delete(input: ChannelParamsInput): Promise<Record<string, unknown>> {
    return this.repository.delete(input.userId, input.channelId);
  }

  addMember(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.addMember(input.userId, input.body);
  }

  removeMember(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.removeMember(input.userId, input.body);
  }

  joinMember(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.joinMember(input.userId, input.body);
  }

  leaveMember(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.leaveMember(input.userId, input.body);
  }

  getChannel(input: ChannelParamsInput): Promise<Record<string, unknown>> {
    return this.repository.getChannel(input.userId, input.channelId);
  }

  getLatestMessages(
    input: ChannelBodyInput & { query: Record<string, unknown> },
  ): Promise<Record<string, unknown>> {
    return this.repository.getLatestMessages(input.userId, input.query);
  }

  getComments(
    input: ChannelBodyInput & { query: Record<string, unknown> },
  ): Promise<Record<string, unknown>> {
    return this.repository.getComments(input.userId, input.query);
  }

  joinByInvitation(input: ChannelBodyInput): Promise<Record<string, unknown>> {
    return this.repository.joinByInvitation(input.userId, input.body);
  }
}
