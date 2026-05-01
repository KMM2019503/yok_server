export type LegacyRequestLike = {
  headers: Record<string, unknown>;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  userid?: string;
  channelId?: string;
  [key: string]: unknown;
};

type BuildLegacyRequestInput = {
  userId?: string;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  channelId?: string;
  extra?: Record<string, unknown>;
};

export const buildLegacyRequest = (
  input: BuildLegacyRequestInput,
): LegacyRequestLike => {
  const request: LegacyRequestLike = {
    headers: {},
    params: input.params ?? {},
    query: input.query ?? {},
    body: input.body ?? {},
    channelId: input.channelId,
  };

  if (input.userId) {
    request.headers.userid = input.userId;
    request.userid = input.userId;
  }

  if (input.extra) {
    Object.assign(request, input.extra);
  }

  return request;
};
