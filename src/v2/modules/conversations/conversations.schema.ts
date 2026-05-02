import { z } from "zod";

export const getConversationsSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      cursorId: z.string().optional(),
    })
    .loose(),
  body: z.object({}).loose(),
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
    .loose(),
  body: z.object({}).loose(),
});

export const getLatestMessagesSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      take: z.string().optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});
