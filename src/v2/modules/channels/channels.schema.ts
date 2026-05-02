import { z } from "zod";

const baseEnvelope = {
  params: z.object({}).loose(),
  query: z.object({}).loose(),
};

export const createChannelSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      name: z.string().min(3).max(50),
      description: z.string().max(255).optional(),
      isPublic: z.boolean().optional(),
      profilePictureUrl: z.string().url().optional(),
      adminIds: z.array(z.string()).optional(),
      isCommentAllowed: z.boolean().optional(),
    })
    .loose(),
});

export const updateChannelSchema = z.object({
  params: z.object({
    channelId: z.string().min(1),
  }),
  query: z.object({}).loose(),
  body: z
    .object({
      name: z.string().min(3).max(50).optional(),
      description: z.string().max(255).optional(),
      isPublic: z.boolean().optional(),
      profilePictureUrl: z.string().url().optional(),
      adminIds: z.array(z.string()).optional(),
      isCommentAllowed: z.boolean().optional(),
    })
    .loose(),
});

export const channelIdParamSchema = z.object({
  params: z.object({
    channelId: z.string().min(1),
  }),
  query: z.object({}).loose(),
  body: z.object({}).loose(),
});

export const channelMessagesSchema = z.object({
  params: z.object({
    channelId: z.string().min(1),
  }),
  query: z
    .object({
      messageId: z.string().optional(),
      take: z.string().optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});

export const initialChannelsSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      take: z.string().optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});

export const commentsSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      messageId: z.string().optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});

export const adminListSchema = z.object({
  params: z.object({
    channelId: z.string().min(1),
  }),
  query: z.object({}).loose(),
  body: z
    .object({
      adminIds: z.array(z.string()).min(1),
    })
    .loose(),
});

export const memberMutationSchema = z.object({
  params: z.object({}).loose(),
  query: z.object({}).loose(),
  body: z
    .object({
      channelId: z.string().min(1),
      userIds: z.array(z.string()).optional(),
    })
    .loose(),
});
