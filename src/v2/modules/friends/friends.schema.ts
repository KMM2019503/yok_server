import { z } from "zod";

// MongoDB ObjectId (24 hex chars). Mirrors the id shape used across the data layer.
const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid id");

const paginationQuery = z
  .object({
    cursor: objectId.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .loose();

// POST /v2/friends/requests — send a friend request
export const sendFriendRequestSchema = z.object({
  params: z.object({}).loose(),
  query: z.object({}).loose(),
  body: z
    .object({
      receiverId: objectId,
    })
    .loose(),
});

// GET /v2/friends/requests/incoming and /outgoing — list pending requests
export const listFriendRequestsSchema = z.object({
  params: z.object({}).loose(),
  query: paginationQuery,
  body: z.object({}).loose(),
});

// GET /v2/friends — list accepted friends (optional name search)
export const listFriendsSchema = z.object({
  params: z.object({}).loose(),
  query: paginationQuery.extend({
    q: z.string().trim().max(100).optional(),
  }),
  body: z.object({}).loose(),
});

// POST /v2/friends/requests/:requestId/accept | /reject and DELETE (cancel)
export const friendRequestIdSchema = z.object({
  params: z.object({
    requestId: objectId,
  }),
  query: z.object({}).loose(),
  body: z.object({}).loose(),
});

// DELETE /v2/friends/:friendId — unfriend
export const friendIdSchema = z.object({
  params: z.object({
    friendId: objectId,
  }),
  query: z.object({}).loose(),
  body: z.object({}).loose(),
});

// GET /v2/friends/status/:userId — relationship status with another user
export const friendshipStatusSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  query: z.object({}).loose(),
  body: z.object({}).loose(),
});
