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

const profileUpdateBodySchema = z
  .object({
    userName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().optional(),
    profilePictureUrl: z.union([z.string().trim().url(), z.null()]).optional(),
    gender: z.union([z.enum(["M", "F", "T"]), z.null()]).optional(),
    dob: z.union([z.string().trim().min(1), z.null()]).optional(),
    dateOfBirth: z.union([z.string().trim().min(1), z.null()]).optional(),
    story: z.string().trim().min(10).max(4000).optional(),
    tags: z.array(tagSlug).min(1).max(30).optional(),
  })
  .loose()
  .superRefine((body, ctx) => {
    const hasAnyValue = [
      body.userName,
      body.email,
      body.profilePictureUrl,
      body.gender,
      body.dob,
      body.dateOfBirth,
      body.story,
      body.tags,
    ].some((value) => value !== undefined);

    if (!hasAnyValue) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one profile field to update.",
        path: [],
      });
    }

    if (body.dob !== undefined && body.dateOfBirth !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Use either 'dob' or 'dateOfBirth', not both.",
        path: ["dateOfBirth"],
      });
    }
  });

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

export const updateMyProfileSchema = z.object({
  params: emptyObject,
  query: emptyObject,
  body: profileUpdateBodySchema,
});

export const profileUserIdSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  query: emptyObject,
  body: emptyObject,
});
