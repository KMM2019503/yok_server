import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { loginSchema, signUpSchema } from "../modules/auth/auth.schema";
import {
  adminListSchema,
  channelIdParamSchema,
  channelMessagesSchema,
  commentsSchema,
  createChannelSchema,
  initialChannelsSchema,
  memberMutationSchema,
  updateChannelSchema,
} from "../modules/channels/channels.schema";
import {
  getConversationMessagesSchema,
  getConversationsSchema,
  getLatestMessagesSchema,
} from "../modules/conversations/conversations.schema";
import {
  sendChannelCommentSchema,
  sendChannelInvitationSchema,
  sendChannelMessageSchema,
  sendDirectMessageSchema,
  sendGroupMessageSchema,
} from "../modules/messages/messages.schema";
import {
  deleteUserSchema,
  fcmTokenSchema,
  findUserByPhoneSchema,
  updateUserSchema,
} from "../modules/users/users.schema";

extendZodWithOpenApi(z);

type RequestEnvelopeSchema = z.ZodObject<{
  params: z.ZodTypeAny;
  query: z.ZodTypeAny;
  body: z.ZodTypeAny;
}>;

type RouteSpec = {
  method: RouteConfig["method"];
  path: string;
  summary: string;
  tag: string;
  schema?: RequestEnvelopeSchema;
  successStatus: 200 | 201;
  requiresAuth?: boolean;
};

const registry = new OpenAPIRegistry();

const genericSuccessResponseSchema = registry.register(
  "GenericSuccessResponse",
  z.record(z.string(), z.unknown()),
);

const genericErrorResponseSchema = registry.register(
  "GenericErrorResponse",
  z.object({ error: z.string() }).passthrough(),
);

const authErrorResponseSchema = registry.register(
  "AuthErrorResponse",
  z
    .object({
      success: z.boolean().optional(),
      message: z.string(),
    })
    .passthrough(),
);

const forbiddenResponseSchema = registry.register(
  "ForbiddenResponse",
  z.object({ message: z.string() }).passthrough(),
);

const validationErrorResponseSchema = registry.register(
  "ValidationErrorResponse",
  z.object({
    error: z.string(),
    details: z.array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    ),
  }),
);

const healthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.string(),
    message: z.string(),
    timestamp: z.string(),
  }),
);

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "token",
  description: "Authentication cookie set by the login/signup endpoints.",
});

registry.registerComponent("securitySchemes", "internalToken", {
  type: "apiKey",
  in: "header",
  name: "x-internal-v2-token",
  description: "Internal V2 token used by the internal-v2 gate when enabled.",
});

const hasObjectFields = (
  schema: z.ZodTypeAny,
): schema is z.ZodObject<z.ZodRawShape> =>
  schema instanceof z.ZodObject && Object.keys(schema.shape).length > 0;

const buildRequest = (
  schema: RequestEnvelopeSchema | undefined,
  method: RouteConfig["method"],
): RouteConfig["request"] => {
  if (!schema) {
    return undefined;
  }

  const request: NonNullable<RouteConfig["request"]> = {};

  if (hasObjectFields(schema.shape.params)) {
    request.params = schema.shape.params;
  }

  if (hasObjectFields(schema.shape.query)) {
    request.query = schema.shape.query;
  }

  if (["post", "put", "patch"].includes(method)) {
    request.body = {
      required: true,
      content: {
        "application/json": {
          schema: schema.shape.body,
        },
      },
    };
  }

  return Object.keys(request).length > 0 ? request : undefined;
};

const createResponses = (
  successStatus: 200 | 201,
  requiresAuth: boolean,
): RouteConfig["responses"] => {
  const responses: RouteConfig["responses"] = {
    [successStatus]: {
      description: successStatus === 201 ? "Created" : "Successful response",
      content: {
        "application/json": {
          schema: genericSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: genericErrorResponseSchema,
        },
      },
    },
  };

  if (requiresAuth) {
    responses[401] = {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: authErrorResponseSchema,
        },
      },
    };

    responses[403] = {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: forbiddenResponseSchema,
        },
      },
    };
  }

  return responses;
};

const routes: RouteSpec[] = [
  {
    method: "get",
    path: "/v2/healthy",
    summary: "V2 health check",
    tag: "System",
    successStatus: 200,
  },

  {
    method: "post",
    path: "/v2/login",
    summary: "Login",
    tag: "Auth",
    schema: loginSchema,
    successStatus: 200,
  },
  {
    method: "post",
    path: "/v2/signup",
    summary: "Sign up",
    tag: "Auth",
    schema: signUpSchema,
    successStatus: 201,
  },
  {
    method: "get",
    path: "/v2/logout",
    summary: "Logout",
    tag: "Auth",
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/checkAuth",
    summary: "Check auth status",
    tag: "Auth",
    successStatus: 200,
    requiresAuth: true,
  },

  {
    method: "get",
    path: "/v2/users/findUserByPhoneNumber/{phoneNumber}",
    summary: "Find user by phone number",
    tag: "Users",
    schema: findUserByPhoneSchema,
    successStatus: 200,
  },
  {
    method: "post",
    path: "/v2/users/update",
    summary: "Update current user",
    tag: "Users",
    schema: updateUserSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "delete",
    path: "/v2/users/delete/{userId}",
    summary: "Delete user",
    tag: "Users",
    schema: deleteUserSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/users/adding-fcm-token",
    summary: "Add FCM token",
    tag: "Users",
    schema: fcmTokenSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/users/removing-fcm-token",
    summary: "Remove FCM token",
    tag: "Users",
    schema: fcmTokenSchema,
    successStatus: 201,
    requiresAuth: true,
  },

  {
    method: "get",
    path: "/v2/channels/initial-channels/fetch-message",
    summary: "Fetch latest messages in channels",
    tag: "Channels",
    schema: initialChannelsSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/channels/get/comments",
    summary: "Get channel message comments",
    tag: "Channels",
    schema: commentsSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/channels/{channelId}",
    summary: "Get channel details",
    tag: "Channels",
    schema: channelIdParamSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/channels/{channelId}/messages",
    summary: "Get channel messages",
    tag: "Channels",
    schema: channelMessagesSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/channels",
    summary: "Get all channels",
    tag: "Channels",
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels",
    summary: "Create channel",
    tag: "Channels",
    schema: createChannelSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "put",
    path: "/v2/channels/update/{channelId}",
    summary: "Update channel",
    tag: "Channels",
    schema: updateChannelSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/{channelId}/add-admin",
    summary: "Add admins to channel",
    tag: "Channels",
    schema: adminListSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/{channelId}/remove-admin",
    summary: "Remove admins from channel",
    tag: "Channels",
    schema: adminListSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "delete",
    path: "/v2/channels/{channelId}",
    summary: "Delete channel",
    tag: "Channels",
    schema: channelIdParamSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/add-members",
    summary: "Add members to channel",
    tag: "Channels",
    schema: memberMutationSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/remove-members",
    summary: "Remove members from channel",
    tag: "Channels",
    schema: memberMutationSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/join-member",
    summary: "Join channel members",
    tag: "Channels",
    schema: memberMutationSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/leave-member",
    summary: "Leave channel members",
    tag: "Channels",
    schema: memberMutationSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/channels/join-channel-by-invite",
    summary: "Join channel by invitation",
    tag: "Channels",
    schema: memberMutationSchema,
    successStatus: 200,
    requiresAuth: true,
  },

  {
    method: "post",
    path: "/v2/messages/direct-message",
    summary: "Send direct message",
    tag: "Messages",
    schema: sendDirectMessageSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/messages/send-invitation",
    summary: "Send channel invitation message",
    tag: "Messages",
    schema: sendChannelInvitationSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/messages/group-messages",
    summary: "Send group message",
    tag: "Messages",
    schema: sendGroupMessageSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/messages/channel-messages",
    summary: "Send channel message",
    tag: "Messages",
    schema: sendChannelMessageSchema,
    successStatus: 201,
    requiresAuth: true,
  },
  {
    method: "post",
    path: "/v2/messages/channel-messages-comment",
    summary: "Send channel message comment",
    tag: "Messages",
    schema: sendChannelCommentSchema,
    successStatus: 201,
    requiresAuth: true,
  },

  {
    method: "get",
    path: "/v2/conversations/get-conversation",
    summary: "Get conversations",
    tag: "Conversations",
    schema: getConversationsSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/conversations/get-messages/{conversationId}",
    summary: "Get conversation messages",
    tag: "Conversations",
    schema: getConversationMessagesSchema,
    successStatus: 200,
    requiresAuth: true,
  },
  {
    method: "get",
    path: "/v2/conversations/initial-conversation/fetch-message",
    summary: "Fetch latest messages in conversations",
    tag: "Conversations",
    schema: getLatestMessagesSchema,
    successStatus: 200,
    requiresAuth: true,
  },
];

for (const route of routes) {
  if (route.path === "/v2/healthy") {
    registry.registerPath({
      method: route.method,
      path: route.path,
      summary: route.summary,
      tags: [route.tag],
      responses: {
        200: {
          description: "Service health status",
          content: {
            "application/json": {
              schema: healthResponseSchema,
            },
          },
        },
        403: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: forbiddenResponseSchema,
            },
          },
        },
      },
      security: [{ internalToken: [] }],
    });
    continue;
  }

  registry.registerPath({
    method: route.method,
    path: route.path,
    summary: route.summary,
    tags: [route.tag],
    request: buildRequest(route.schema, route.method),
    responses: createResponses(route.successStatus, route.requiresAuth ?? false),
    security: route.requiresAuth
      ? [{ internalToken: [], cookieAuth: [] }]
      : [{ internalToken: [] }],
  });
}

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Yok Server API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for the Yok Server v2 endpoints. Most v2 routes require the internal token header and authenticated routes also require the token cookie.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "System", description: "Service health and operational endpoints" },
    { name: "Auth", description: "Authentication and session endpoints" },
    { name: "Users", description: "User profile and token management endpoints" },
    { name: "Channels", description: "Channel lifecycle and membership endpoints" },
    { name: "Messages", description: "Direct, group, and channel message endpoints" },
    {
      name: "Conversations",
      description: "Conversation list and message retrieval endpoints",
    },
  ],
});
