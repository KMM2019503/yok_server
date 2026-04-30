import { z } from "zod";

export const getConversationsSchema = z.object({
  params: z.object({}).passthrough(),
  query: z
    .object({
      cursorId: z.string().optional(),
    })
    .passthrough(),
  body: z.object({}).passthrough(),
});

export const getConversationMessagesSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1),
  }),
  query: z
    .object({
      cursorId: z.string().optional(),
      take: z.string().optional(),
    })
    .passthrough(),
  body: z.object({}).passthrough(),
});

export const getLatestMessagesSchema = z.object({
  params: z.object({}).passthrough(),
  query: z
    .object({
      take: z.string().optional(),
    })
    .passthrough(),
  body: z.object({}).passthrough(),
});
