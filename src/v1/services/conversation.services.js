import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllConversationsService = async (req) => {
  try {
    const { userid } = req.headers;

    if (!userid) {
      throw new Error("User Id not found");
    }
    const { page, size } = req.query; // Pagination parameters
    if (!(page && size)) {
      const conversations = await prisma.conversation.findMany({
        where: {
          members: {
            some: {
              userId: userid,
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
                  phone: true,
                  profilePictureUrl: true,
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
      });
      return {
        success: true,
        conversations: conversations,
      };
    }

    // Calculate the offset for pagination
    const skip = (page - 1) * size;
    const take = Number(size);

    // Fetch conversations where the user is a member, with pagination
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: userid,
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
                phone: true,
                profilePictureUrl: true,
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
            userId: userid,
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
    const { userid } = req.headers;
    const { conversationId } = req.params;
    const { page = 1, size = 15 } = req.query; // Pagination parameters

    // Calculate the offset for pagination
    const skip = (page - 1) * size;
    const take = Number(size);

    // Fetch the conversation where the user is a member
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        members: {
          some: {
            userId: userid,
          },
        },
      },
      include: {
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
                phone: true,
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

export const syncConversationsService = async (req, res) => {
  try {
    const { userid } = req.headers;

    if (!userid) {
      return res.status(400).json({ error: "User Id not found" });
    }

    const { conversations } = req.body; // Expecting an array of conversation objects

    if (!Array.isArray(conversations) || conversations.length === 0) {
      return res.status(400).json({ error: "No conversations provided" });
    }

    // Step 1: Upsert each conversation based on conversationId
    const upsertedConversations = await Promise.all(
      conversations.map((conversation) =>
        prisma.conversation.upsert({
          where: { conversationId: conversation.conversationId }, // Ensure this field matches your schema
          update: {
            lastActivity: new Date(conversation.lastActivity),
            updatedAt: new Date(conversation.updatedAt),
          },
          create: {
            conversationId: conversation.conversationId,
            createdAt: new Date(conversation.createdAt),
            lastActivity: new Date(conversation.lastActivity),
            updatedAt: new Date(conversation.updatedAt),
            members: {
              create: conversation.members.map((member) => ({
                userId: member.userId,
                joinedAt: new Date(member.joinedAt),
              })),
            },
          },
          include: {
            members: true,
            lastMessage: true,
            pinnedItems: true,
          },
        })
      )
    );

    // Step 2: Return success response with upserted conversations
    return res.status(200).json({
      success: true,
      message: "Conversations synced successfully",
      conversations: upsertedConversations,
    });
  } catch (error) {
    logger.error("Error syncing conversations:", error);
    return res.status(500).json({ error: "Failed to sync conversations" });
  }
};
