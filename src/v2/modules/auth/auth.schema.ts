import { z } from "zod";

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .loose(),
  params: z.object({}).loose(),
  query: z.object({}).loose(),
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
    .loose(),
  params: z.object({}).loose(),
  query: z.object({}).loose(),
});
