import { z } from "zod";

const baseEnvelope = {
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
};

export const sendDirectMessageSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      content: z.string().min(1),
      conversationId: z.string().optional(),
      receiverId: z.string().min(1),
      photoUrl: z.array(z.string()).optional(),
      fileUrls: z.array(z.string()).optional(),
      originalMessageId: z.string().optional(),
    })
    .passthrough(),
});

export const sendChannelInvitationSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      phoneNumbers: z.array(z.string().min(1)).min(1),
      channelId: z.string().min(1),
    })
    .passthrough(),
});

export const sendGroupMessageSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      content: z.string().optional(),
      groupId: z.string().min(1),
      photoUrl: z.array(z.string()).optional(),
      fileUrls: z.array(z.string()).optional(),
    })
    .passthrough(),
});

export const sendChannelMessageSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      content: z.string().optional(),
      channelId: z.string().min(1),
      photoUrl: z.array(z.string()).optional(),
      fileUrls: z.array(z.string()).optional(),
    })
    .passthrough(),
});

export const sendChannelCommentSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      content: z.string().min(1),
      messageId: z.string().min(1),
    })
    .passthrough(),
});
