import { z } from "zod";

const baseEnvelope = {
  params: z.object({}).loose(),
  query: z.object({}).loose(),
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
  .loose();

export const searchUsersSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      q: z.string().trim().min(1, "Search query is required").max(100),
    })
    .loose(),
  body: z.object({}).loose(),
});

export const updateLocationSchema = z.object({
  ...baseEnvelope,
  body: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .loose(),
});

// `maxDistance` is expressed in kilometres and defaults to 5 km in the controller.
export const nearbyUsersSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      maxDistance: z.coerce.number().positive().max(500).optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});

export const removeLocationSchema = z.object({
  ...baseEnvelope,
  body: z.object({}).loose(),
});

export const findUserByPhoneSchema = z.object({
  params: z.object({
    phoneNumber: phoneNumberSchema,
  }),
  query: baseEnvelope.query,
  body: z.object({}).loose(),
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
  body: z.object({}).loose(),
});

export const fcmTokenSchema = z.object({
  ...baseEnvelope,
  body: z.object({
    fcmToken: z.string().trim().min(1),
  }).loose(),
});
