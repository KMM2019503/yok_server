export type Pagination = {
  cursor?: string;
  limit?: number;
};

export type SendFriendRequestInput = {
  userId: string;
  receiverId: string;
};

export type ListRequestsInput = Pagination & {
  userId: string;
};

export type ListFriendsInput = Pagination & {
  userId: string;
  q?: string;
};

export type RequestActionInput = {
  userId: string;
  requestId: string;
};

export type UnfriendInput = {
  userId: string;
  friendId: string;
};

export type FriendshipStatusInput = {
  userId: string;
  targetUserId: string;
};

export type FriendshipState =
  | "SELF"
  | "BLOCKED"
  | "FRIENDS"
  | "REQUEST_INCOMING"
  | "REQUEST_OUTGOING"
  | "NONE";
