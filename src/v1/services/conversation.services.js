import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllConversationsService = async (req) => {
  try {
    const { userId } = req.header;
    const { page = 1, size = 15 } = req.query; // Pagination parameters

    // Calculate the offset for pagination
    const skip = (page - 1) * size;
    const take = Number(size);

    // Fetch conversations where the user is a member, with pagination
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
                status: true,
              },
            },
          },
        },
        lastMessage: true,
        pinnedItems: true,
      },
      orderBy: {
        lastActivity: "desc",
      },
      skip: skip,
      take: take,
    });

    // Fetch total number of conversations for the user
    const totalConversations = await prisma.conversation.count({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalConversations / size);

    return {
      success: true,
      conversations,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        pageSize: size,
        totalConversations: totalConversations,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getConversationService = async (req) => {
  try {
    const { userId } = req.header;
    const { conversationId } = req.params;
    const { page = 1, size = 15 } = req.query; // Pagination parameters

    // Calculate the offset for pagination
    const skip = (page - 1) * size;
    const take = Number(size);

    // Fetch the conversation where the user is a member
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
                status: true,
              },
            },
          },
        },
        messages: {
          skip: skip,
          take: take,
          orderBy: {
            createdAt: "desc", // Order messages by creation date, most recent first
          },
          select: {
            id: true,
            content: true,
            photoUrl: true,
            fileUrls: true,
            status: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        lastMessage: true,
        pinnedItems: true,
      },
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ error: "Conversation not found or you are not a member." });
    }

    // Fetch total number of messages in the conversation
    const totalMessages = await prisma.message.count({
      where: { conversationId: conversationId },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalMessages / size);
    return {
      success: true,
      conversation,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        pageSize: size,
        totalMessages: totalMessages,
      },
    };
  } catch (error) {
    throw error;
  }
};
