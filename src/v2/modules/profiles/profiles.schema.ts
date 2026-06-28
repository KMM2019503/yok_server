import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid id");

const emptyObject = z.object({}).loose();

const tagSlug = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Tags must be lowercase kebab-case");

export const submitProfileStorySchema = z.object({
  params: emptyObject,
  query: emptyObject,
  body: z
    .object({
      story: z.string().trim().min(10).max(4000),
    })
    .loose(),
});

export const confirmProfileTagsSchema = z.object({
  params: emptyObject,
  query: emptyObject,
  body: z
    .object({
      tags: z.array(tagSlug).min(1).max(30),
    })
    .loose(),
});

export const skipProfileSchema = z.object({
  params: emptyObject,
  query: emptyObject,
  body: emptyObject,
});

export const getMyProfileSchema = z.object({
  params: emptyObject,
  query: emptyObject,
  body: emptyObject,
});

export const profileUserIdSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  query: emptyObject,
  body: emptyObject,
});
