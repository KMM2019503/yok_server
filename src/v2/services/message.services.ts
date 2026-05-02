import type { Prisma } from "@prisma/client";
import prisma from "../../../prisma/prismaClient.js";
import { getReceiverSocketId, io } from "../../../socket/Socket.js";
import type {
  ChannelCommentBody,
  ChannelInvitationBody,
  ChannelMessageBody,
  DirectMessageBody,
  GroupMessageBody,
  MessageServiceResult,
} from "../modules/messages/messages.types";
import logger from "../utils/logger.js";

const MAX_PREVIEW_LENGTH = 30;
const ATTACHMENT_PREVIEW = "Attachments sent.";

const CONVERSATION_MEMBER_INCLUDE = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          userName: true,
          profilePictureUrl: true,
          fcm: true,
        },
      },
    },
  },
} satisfies Prisma.ConversationInclude;

const DIRECT_SENDER_SELECT = {
  id: true,
  userName: true,
  profilePictureUrl: true,
} satisfies Prisma.UserSelect;

const DIRECT_MESSAGE_SELECT = {
  id: true,
  content: true,
  photoUrl: true,
  fileUrls: true,
  status: true,
  createdAt: true,
  sender: {
    select: DIRECT_SENDER_SELECT,
  },
  messageType: true,
  conversationId: true,
  references: true,
} satisfies Prisma.MessageSelect;

const GROUP_MESSAGE_SELECT = {
  id: true,
  content: true,
  photoUrl: true,
  fileUrls: true,
  status: true,
  createdAt: true,
  messageType: true,
  groupId: true,
  sender: {
    select: {
      id: true,
      userName: true,
      profilePictureUrl: true,
    },
  },
} satisfies Prisma.MessageSelect;

const CHANNEL_MESSAGE_SELECT = {
  id: true,
  content: true,
  photoUrl: true,
  fileUrls: true,
  status: true,
  createdAt: true,
  channelId: true,
  messageType: true,
  sender: {
    select: {
      id: true,
      userName: true,
      profilePictureUrl: true,
    },
  },
} satisfies Prisma.MessageSelect;

const CHANNEL_INVITATION_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  conversationId: true,
  sender: {
    select: DIRECT_SENDER_SELECT,
  },
  references: true,
  messageType: true,
} satisfies Prisma.MessageSelect;

const CHANNEL_COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  createdBy: {
    select: {
      id: true,
      userName: true,
      profilePictureUrl: true,
    },
  },
  message: {
    select: {
      id: true,
      channelId: true,
    },
  },
} satisfies Prisma.CommentSelect;

class MessageServices {
  private static instance: MessageServices | null = null;

  private constructor() {}

  static getInstance(): MessageServices {
    if (!MessageServices.instance) {
      MessageServices.instance = new MessageServices();
    }

    return MessageServices.instance;
  }

  async sendDirectMessage(
    userId: string,
    body: DirectMessageBody,
  ): Promise<MessageServiceResult> {
    const {
      content,
      conversationId,
      receiverId,
      photoUrl = [],
      fileUrls = [],
      originalMessageId,
    } = body;

    const now = new Date();
    const preview = this.buildPreview(content, photoUrl, fileUrls);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const conversation = await this.getOrCreateConversation(
          tx,
          conversationId,
          userId,
          receiverId,
        );

        const messageData: Prisma.MessageCreateInput = {
          sender: {
            connect: { id: userId },
          },
          content,
          photoUrl,
          fileUrls,
          conversation: {
            connect: { id: conversation.id },
          },
          status: {
            status: "SENT",
            seenUserIds: [],
          },
        };

        if (originalMessageId) {
          messageData.references = {
            originalMessageId,
          };
        }

        const message = await tx.message.create({
          data: messageData,
          select: DIRECT_MESSAGE_SELECT,
        });

        const updatedConversation = await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: {
              content: preview,
              senderId: userId,
              createdAt: now,
            },
            lastActivity: now,
          },
          include: CONVERSATION_MEMBER_INCLUDE,
        });

        if (photoUrl.length > 0) {
          await tx.fileUrls.createMany({
            data: photoUrl.map((url) => ({
              url,
              messageId: message.id,
              conversationId: conversation.id,
            })),
          });
        }

        return {
          message,
          updatedConversation,
        };
      });

      this.emitDirectMessage(receiverId, result.message, result.updatedConversation);

      return {
        success: true,
        message: result.message,
        conversation: result.updatedConversation,
      };
    } catch (error) {
      this.logAndRethrow("Error sending DM message", error);
    }
  }

  async sendChannelInvitation(
    userId: string,
    body: ChannelInvitationBody,
  ): Promise<MessageServiceResult> {
    const { phoneNumbers, channelId } = body;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error("No receivers provided");
    }

    try {
      const receiverIdentifiers = Array.from(
        new Set(phoneNumbers.map((value) => value.trim()).filter(Boolean)),
      );

      if (receiverIdentifiers.length === 0) {
        throw new Error("No valid receiver identifiers provided");
      }

      const [receivers, channel] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              {
                userUniqueID: {
                  in: receiverIdentifiers,
                },
              },
              {
                email: {
                  in: receiverIdentifiers,
                },
              },
            ],
          },
          select: {
            id: true,
          },
        }),
        prisma.channel.findUnique({
          where: { id: channelId },
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        }),
      ]);

      if (!channel) {
        throw new Error("Channel not found");
      }

      const now = new Date();
      const receiverIds = receivers.map((receiver) => receiver.id);

      await Promise.all(
        receiverIds.map(async (receiverId) => {
          const result = await prisma.$transaction(async (tx) => {
            const conversation = await this.getOrCreateConversation(
              tx,
              undefined,
              userId,
              receiverId,
            );

            const message = await tx.message.create({
              data: {
                senderId: userId,
                content: "Channel Invitation.",
                conversationId: conversation.id,
                messageType: "CHANNEL_INVITATION",
                references: {
                  channelId: channel.id,
                  channelName: channel.name,
                  imageUrl: channel.profilePictureUrl,
                },
                status: {
                  status: "SENT",
                  seenUserIds: [],
                },
              },
              select: CHANNEL_INVITATION_SELECT,
            });

            const updatedConversation = await tx.conversation.update({
              where: { id: conversation.id },
              data: {
                lastMessage: {
                  content: "Channel Invitation",
                  senderId: userId,
                  createdAt: now,
                },
                lastActivity: now,
              },
              include: CONVERSATION_MEMBER_INCLUDE,
            });

            return {
              message,
              updatedConversation,
            };
          });

          this.emitDirectMessage(
            receiverId,
            result.message,
            result.updatedConversation,
          );
        }),
      );

      return {
        success: true,
      };
    } catch (error) {
      this.logAndRethrow("Error sending channel invitations", error);
    }
  }

  async sendGroupMessage(
    userId: string,
    body: GroupMessageBody,
  ): Promise<MessageServiceResult> {
    const { content, groupId, photoUrl = [], fileUrls = [] } = body;
    const safeContent = content ?? "";
    const now = new Date();
    const preview = this.buildPreview(safeContent, photoUrl, fileUrls);

    try {
      const message = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.message.create({
          data: {
            senderId: userId,
            content: safeContent,
            groupId,
            photoUrl,
            fileUrls,
            status: {
              status: "SENT",
              seenUserIds: [],
            },
          },
          select: GROUP_MESSAGE_SELECT,
        });

        await this.updateGroupLastMessageIfLatest(
          tx,
          groupId,
          createdMessage.createdAt,
          {
            content: preview,
            senderId: userId,
            createdAt: now,
          },
          now,
        );

        if (photoUrl.length > 0) {
          await tx.fileUrls.createMany({
            data: photoUrl.map((url) => ({
              url,
              messageId: createdMessage.id,
              groupId,
            })),
          });
        }

        return createdMessage;
      });

      this.emitGroupMessage(groupId, message);

      return {
        success: true,
        message,
      };
    } catch (error) {
      this.logAndRethrow("Error sending group message", error);
    }
  }

  async sendChannelMessage(
    userId: string,
    body: ChannelMessageBody,
  ): Promise<MessageServiceResult> {
    const { content, channelId, photoUrl = [], fileUrls = [] } = body;
    const safeContent = content ?? "";
    const now = new Date();
    const preview = this.buildPreview(safeContent, photoUrl, fileUrls);

    try {
      const message = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.message.create({
          data: {
            senderId: userId,
            content: safeContent,
            channelId,
            photoUrl,
            fileUrls,
            status: {
              status: "SENT",
              seenUserIds: [],
            },
          },
          select: CHANNEL_MESSAGE_SELECT,
        });

        await this.updateChannelLastMessageIfLatest(
          tx,
          channelId,
          createdMessage.createdAt,
          {
            content: preview,
            senderId: userId,
            createdAt: now,
          },
          now,
        );

        if (photoUrl.length > 0) {
          await tx.fileUrls.createMany({
            data: photoUrl.map((url) => ({
              url,
              messageId: createdMessage.id,
              channelId,
            })),
          });
        }

        return createdMessage;
      });

      this.emitChannelMessage(channelId, message);

      return {
        success: true,
        message,
      };
    } catch (error) {
      this.logAndRethrow("Error sending channel message", error);
    }
  }

  async sendChannelComment(
    userId: string,
    body: ChannelCommentBody,
  ): Promise<MessageServiceResult> {
    const { content, messageId } = body;

    if (!userId || !content || !messageId) {
      throw new Error("Missing userid or content or message id from request body");
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          createdById: userId,
          messageId,
        },
        select: CHANNEL_COMMENT_SELECT,
      });

      if (comment.message.channelId) {
        this.emitChannelComment(comment.message.channelId, comment);
      }

      return {
        success: true,
        comment,
      };
    } catch (error) {
      this.logAndRethrow("Error sending channel comment", error);
    }
  }

  private async getOrCreateConversation(
    tx: Prisma.TransactionClient,
    conversationId: string | undefined,
    userId: string,
    receiverId: string,
  ) {
    if (conversationId) {
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
        include: CONVERSATION_MEMBER_INCLUDE,
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return conversation;
    }

    const existingConversation = await tx.conversation.findFirst({
      where: {
        members: {
          every: {
            userId: {
              in: [userId, receiverId],
            },
          },
          some: {
            userId,
          },
        },
      },
      include: CONVERSATION_MEMBER_INCLUDE,
    });

    if (existingConversation) {
      return existingConversation;
    }

    return tx.conversation.create({
      data: {
        members: {
          create: [{ userId }, { userId: receiverId }],
        },
      },
      include: CONVERSATION_MEMBER_INCLUDE,
    });
  }

  private async updateGroupLastMessageIfLatest(
    tx: Prisma.TransactionClient,
    groupId: string,
    messageCreatedAt: Date,
    lastMessage: { content: string; senderId: string; createdAt: Date },
    lastActivity: Date,
  ) {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { lastMessage: true },
    });

    if (
      !group ||
      !group.lastMessage ||
      new Date(group.lastMessage.createdAt) <= messageCreatedAt
    ) {
      await tx.group.update({
        where: { id: groupId },
        data: {
          lastMessage,
          lastActivity,
        },
      });
    }
  }

  private async updateChannelLastMessageIfLatest(
    tx: Prisma.TransactionClient,
    channelId: string,
    messageCreatedAt: Date,
    lastMessage: { content: string; senderId: string; createdAt: Date },
    lastActivity: Date,
  ) {
    const channel = await tx.channel.findUnique({
      where: { id: channelId },
      select: { lastMessage: true },
    });

    if (
      !channel ||
      !channel.lastMessage ||
      new Date(channel.lastMessage.createdAt) <= messageCreatedAt
    ) {
      await tx.channel.update({
        where: { id: channelId },
        data: {
          lastMessage,
          lastActivity,
        },
      });
    }
  }

  private emitDirectMessage(
    receiverId: string,
    message: unknown,
    updatedConversation?: unknown,
  ) {
    const receiverSocketId = getReceiverSocketId(receiverId) as unknown;

    if (
      typeof receiverSocketId !== "string" ||
      receiverSocketId.length === 0
    ) {
      return;
    }

    io.to(receiverSocketId).emit(
      "incomingNewMessage",
      {
        message,
        updatedConversation,
      },
      (ack: boolean) => {
        if (!ack) {
          logger.error(
            "Socket emit acknowledgment failed, recipient might be disconnected",
          );
        }
      },
    );
  }

  private emitGroupMessage(groupId: string, message: unknown) {
    io.to(groupId).emit("newGroupMessage", message);
  }

  private emitChannelMessage(channelId: string, message: unknown) {
    io.to(channelId).emit("newChannelMessage", message);
  }

  private emitChannelComment(channelId: string, comment: unknown) {
    io.to(channelId).emit("newChannelComment", comment);
  }

  private buildPreview(
    content: string,
    photoUrl: string[],
    fileUrls: string[],
  ): string {
    if (photoUrl.length > 0 || fileUrls.length > 0) {
      return ATTACHMENT_PREVIEW;
    }

    if (content.length <= MAX_PREVIEW_LENGTH) {
      return content;
    }

    return `${content.slice(0, MAX_PREVIEW_LENGTH)}...`;
  }

  private logAndRethrow(scope: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(scope, { message, stack });

    throw error;
  }
}

export const messageServices = MessageServices.getInstance();

export { MessageServices };
