export type DirectMessageBody = {
  content: string;
  conversationId?: string;
  receiverId: string;
  photoUrl?: string[];
  fileUrls?: string[];
  originalMessageId?: string;
};

export type ChannelInvitationBody = {
  phoneNumbers: string[];
  channelId: string;
};

export type GroupMessageBody = {
  content?: string;
  groupId: string;
  photoUrl?: string[];
  fileUrls?: string[];
};

export type ChannelMessageBody = {
  content?: string;
  channelId: string;
  photoUrl?: string[];
  fileUrls?: string[];
};

export type ChannelCommentBody = {
  content: string;
  messageId: string;
};

export type DirectMessageInput = {
  userId: string;
  body: DirectMessageBody;
};

export type ChannelInvitationInput = {
  userId: string;
  body: ChannelInvitationBody;
};

export type GroupMessageInput = {
  userId: string;
  body: GroupMessageBody;
};

export type ChannelMessageInput = {
  userId: string;
  body: ChannelMessageBody;
};

export type ChannelCommentInput = {
  userId: string;
  body: ChannelCommentBody;
};

export type MessageServiceResult = Record<string, unknown>;
