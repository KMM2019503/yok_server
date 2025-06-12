//conversation.services.js

import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";

export const getAllConversationsService = async (req) => {
  try {
    const userid = req.userid;
    const { cursorId } = req.query;

    if (!userid) {
      throw new Error("User Id not found");
    }

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
                profilePictureUrl: true,
                lastActiveAt: true
              },
            },
          },
        },
        lastMessage: true,
      },
      orderBy: {
        lastActivity: "desc",
      },
      take: 15, // Limit to 20 conversations per fetch
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0, // Skip the cursor if it exists
    });

    return {
      success: true,
      conversations,
      // Provide the last conversation ID for next pagination
      nextCursor:
        conversations.length > 0
          ? conversations[conversations.length - 1].id
          : null,
    };
  } catch (error) {
    throw error;
  }
};

export const getConversationMessagesService = async (req, res) => {
  try {
    const userid = req.userid;
    const { conversationId } = req.params;
    const { cursorId, take } = req.query;
    if(!userid) {
      throw new Error("User Id not found");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        createdAt: "desc",
      },
      take: take ? parseInt(take) : 15,
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        senderId: true,
      }
    })

    return {
      success: true,
      messages,
    };
  } catch (error) {
    throw error;
  }
};

export const getConversationService = async (req) => {
  try {
    const { userid } = req.headers;
    const { conversationId } = req.params;

    logger.debug(req.headers);

    if (!userid) {
      throw new Error("User Id not found");
    }

    // Fetch conversations where the user is a member, with pagination
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
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
    });

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    throw error;
  }
};

export const getLatestMessagesInConversationsService = async (req) => {
  try {
    const { userid } = req.headers;
    let { take } = req.query;

    if (!userid) {
      throw new Error("User Id not found");
    }

    if (take <= 0) {
      throw new Error(
        "Invalid 'take' parameter. It must be a positive number."
      );
    }

    take = parseInt(take) || 10;

    // Fetch conversations where the user is a member without pagination
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take,
          select: {
            id: true,
            content: true,
            photoUrl: true,
            fileUrls: true,
            status: true,
            createdAt: true,
            conversationId: true,
            messageType: true,
            references: true,
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
      orderBy: {
        lastActivity: "desc",
      },
    });

    return {
      success: true,
      conversations,
    };
  } catch (error) {
    throw error;
  }
};

export const getAllFileUrlsService = async (req) => {
  try {
    const { userid } = req.headers;
    const { FileUrlsId, conversationId } = req.query;

    console.log("🚀 ~ getAllFileUrlsService ~ conversationId:", conversationId);
    console.log("🚀 ~ getAllFileUrlsService ~ FileUrlsId:", FileUrlsId);

    if (!userid) {
      throw new Error("User ID is required");
    }

    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    // Initialize the query object
    const fileUrlQuery = {
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    };

    // Handle FileUrlsId for pagination
    if (FileUrlsId) {
      if (!ObjectId.isValid(FileUrlsId)) {
        throw new Error("Invalid FileUrlsId format");
      }

      const objectIdTimestamp = ObjectId(FileUrlsId).getTimestamp();

      fileUrlQuery.where = {
        ...fileUrlQuery.where,
        createdAt: {
          lt: objectIdTimestamp, // Compare using the extracted timestamp
        },
      };
    }

    console.log("🚀 ~ getAllFileUrlsService ~ fileUrlQuery:", fileUrlQuery);

    // Fetch file URLs from the database
    const fileUrls = await prisma.fileUrls.findMany(fileUrlQuery);

    // Return response
    return {
      success: true,
      fileUrls,
    };
  } catch (error) {
    // Log error and rethrow
    console.error("Error fetching file URLs:", error);
    throw new Error("Failed to fetch file URLs. Please try again later.");
  }
};
