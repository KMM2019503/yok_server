export type ChannelUserContext = {
  userId: string;
};

export type ChannelCreateInput = ChannelUserContext & {
  body: Record<string, unknown>;
};

export type ChannelUpdateInput = ChannelUserContext & {
  channelId: string;
  body: Record<string, unknown>;
};

export type ChannelParamsInput = ChannelUserContext & {
  channelId: string;
  query?: Record<string, unknown>;
};

export type ChannelBodyInput = ChannelUserContext & {
  body: Record<string, unknown>;
};
