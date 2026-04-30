import { z } from "zod";

export const findUserByPhoneSchema = z.object({
  params: z.object({
    phoneNumber: z.string().min(1),
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const updateUserSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const fcmTokenSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({
    fcmToken: z.string().min(1),
  }),
});
