export type ConversationListInput = {
  userId: string;
  query: Record<string, unknown>;
};

export type ConversationMessagesInput = {
  userId: string;
  conversationId: string;
  query: Record<string, unknown>;
};

export type ConversationLatestInput = {
  userId: string;
  query: Record<string, unknown>;
};
