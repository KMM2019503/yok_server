import { z } from "zod";

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const signUpSchema = z.object({
  body: z
    .object({
      userName: z.string().min(1),
      profilePictureUrl: z.string().url().optional(),
      email: z.string().email(),
      gender: z.enum(["M", "F", "T"]).optional(),
      dob: z.string().optional(),
      passwords: z.string().min(1),
    })
    .passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});
