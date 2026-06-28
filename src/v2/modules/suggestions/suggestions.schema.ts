import { z } from "zod";

export const listFriendSuggestionsSchema = z.object({
  params: z.object({}).loose(),
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(50).optional(),
    })
    .loose(),
  body: z.object({}).loose(),
});
