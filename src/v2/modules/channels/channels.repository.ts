import {
  addAdminService,
  addMemberToChannelService,
  createChannelService,
  deleteChannelService,
  getAllChannelsService,
  getChannelMessagesServices,
  getChannelService,
  getCommentsService,
  getLatestMessagesInChannelsService,
  joinChannelByInvitationServices,
  joinMemberToChannelService,
  leaveMemberFromChannelService,
  removeAdminService,
  removeMemberFromChannelService,
  updateChannelService,
} from "../../services/channel.services.js";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";

export class ChannelsRepository {
  create(userId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return createChannelService(request);
  }

  update(
    userId: string,
    channelId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      channelId,
      body,
    });

    return updateChannelService(request);
  }

  getAll(
    userId: string,
    params: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, params });
    return getAllChannelsService(request);
  }

  getMessages(
    userId: string,
    channelId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      params: { channelId },
      query,
    });

    return getChannelMessagesServices(request);
  }

  addAdmin(
    userId: string,
    channelId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      channelId,
      body,
    });

    return addAdminService(request);
  }

  removeAdmin(
    userId: string,
    channelId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      channelId,
      body,
    });

    return removeAdminService(request);
  }

  delete(userId: string, channelId: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      params: { channelId },
    });

    return deleteChannelService(request);
  }

  addMember(userId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return addMemberToChannelService(request);
  }

  removeMember(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return removeMemberFromChannelService(request);
  }

  joinMember(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return joinMemberToChannelService(request);
  }

  leaveMember(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return leaveMemberFromChannelService(request);
  }

  getChannel(userId: string, channelId: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      params: { channelId },
    });

    return getChannelService(request);
  }

  getLatestMessages(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, query });
    return getLatestMessagesInChannelsService(request);
  }

  getComments(
    userId: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, query });
    return getCommentsService(request);
  }

  joinByInvitation(
    userId: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({ userId, body });
    return joinChannelByInvitationServices(request);
  }
}
