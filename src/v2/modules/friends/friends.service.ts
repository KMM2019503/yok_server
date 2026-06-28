import type { FriendsRepository } from "./friends.repository";
import type {
  FriendshipStatusInput,
  ListFriendsInput,
  ListRequestsInput,
  RequestActionInput,
  SendFriendRequestInput,
  UnfriendInput,
} from "./friends.types";

export class FriendsService {
  constructor(private readonly repository: FriendsRepository) {}

  sendRequest(input: SendFriendRequestInput): Promise<Record<string, unknown>> {
    return this.repository.sendRequest(input.userId, input.receiverId);
  }

  listIncoming(input: ListRequestsInput): Promise<Record<string, unknown>> {
    return this.repository.listIncoming(input.userId, {
      cursor: input.cursor,
      limit: input.limit,
    });
  }

  listOutgoing(input: ListRequestsInput): Promise<Record<string, unknown>> {
    return this.repository.listOutgoing(input.userId, {
      cursor: input.cursor,
      limit: input.limit,
    });
  }

  accept(input: RequestActionInput): Promise<Record<string, unknown>> {
    return this.repository.accept(input.userId, input.requestId);
  }

  reject(input: RequestActionInput): Promise<Record<string, unknown>> {
    return this.repository.reject(input.userId, input.requestId);
  }

  cancel(input: RequestActionInput): Promise<Record<string, unknown>> {
    return this.repository.cancel(input.userId, input.requestId);
  }

  listFriends(input: ListFriendsInput): Promise<Record<string, unknown>> {
    return this.repository.listFriends(
      input.userId,
      { cursor: input.cursor, limit: input.limit },
      input.q,
    );
  }

  unfriend(input: UnfriendInput): Promise<Record<string, unknown>> {
    return this.repository.unfriend(input.userId, input.friendId);
  }

  getStatus(input: FriendshipStatusInput): Promise<Record<string, unknown>> {
    return this.repository.getStatus(input.userId, input.targetUserId);
  }
}
