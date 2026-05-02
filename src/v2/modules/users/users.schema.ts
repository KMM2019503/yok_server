import { z } from "zod";

const baseEnvelope = {
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
};

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+\d[\d\s]*$/, "Phone number must start with '+' and contain only digits/spaces.");

const updateUserBodySchema = z
  .object({
    phone: phoneNumberSchema.optional(),
    userName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().optional(),
    profilePictureUrl: z.string().trim().url().optional(),
    gender: z.enum(["M", "F", "T"]).optional(),
    dob: z.string().trim().min(1).optional(),
    dateOfBirth: z.string().trim().min(1).optional(),
  })
  .passthrough();

export const findUserByPhoneSchema = z.object({
  params: z.object({
    phoneNumber: phoneNumberSchema,
  }),
  query: baseEnvelope.query,
  body: z.object({}).passthrough(),
});

export const updateUserSchema = z.object({
  ...baseEnvelope,
  body: updateUserBodySchema,
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().trim().min(1),
  }),
  query: baseEnvelope.query,
  body: z.object({}).passthrough(),
});

export const fcmTokenSchema = z.object({
  ...baseEnvelope,
  body: z.object({
    fcmToken: z.string().trim().min(1),
  }).passthrough(),
});
