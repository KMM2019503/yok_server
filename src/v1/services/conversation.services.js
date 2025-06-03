//conversation.services.js

import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";
export const getAllConversationsService = async (req) => {
  try {
    const userid = req.userid;
    const { cursorId } = req.query; // The last conversation ID from previous fetch

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
              },
            },
          },
        },
        lastMessage: true
      },
      orderBy: {
        lastActivity: "desc",
      },
      take: 20, // Limit to 20 conversations per fetch
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0, // Skip the cursor if it exists
    });

    return {
      success: true,
      conversations,
      // Provide the last conversation ID for next pagination
      nextCursor: conversations.length > 0 ? conversations[conversations.length - 1].id : null,
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

export const getConversationMessagesService = async (req, res) => {
  try {
    const { userid } = req.headers;
    const { conversationId } = req.params;
    const { messageId, take } = req.query; // Only keep messageId for conditional queries

    // Define the base query for fetching messages
    const messagesQuery = {
      orderBy: {
        createdAt: "desc", // Order messages by creation date, most recent first
      },
      take: parseInt(take) || 25,
      select: {
        id: true,
        content: true,
        photoUrl: true,
        fileUrls: true,
        status: true,
        messageType: true,
        references: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: {
            id: true,
            userName: true,
            phone: true,
            profilePictureUrl: true,
          },
        },
      },
    };

    if (messageId) {
      messagesQuery.where = {
        conversationId,
        id: {
          lt: messageId,
        },
      };
    } else {
      // If no messageId is provided, fetch the latest messages in the conversation
      messagesQuery.where = { conversationId };
    }

    console.log(
      "🚀 ~ getConversationMessagesService ~ messagesQuery:",
      messagesQuery
    );

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
        messages: messagesQuery,
        lastMessage: true,
        pinnedItems: true,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation not found or you are not a member.`);
    }

    return {
      success: true,
      conversation,
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

//with pagination
// export const getAllConversationsService = async (req) => {
//   try {
//     const { userid } = req.headers;

//     logger.debug(req.headers);

//     if (!userid) {
//       throw new Error("User Id not found");
//     }
//     const { page, size } = req.query; // Pagination parameters
//     if (!(page && size)) {
//       const conversations = await prisma.conversation.findMany({
//         where: {
//           members: {
//             some: {
//               userId: userid,
//             },
//           },
//         },
//         include: {
//           members: {
//             include: {
//               user: {
//                 select: {
//                   id: true,
//                   userName: true,
//                   phone: true,
//                   profilePictureUrl: true,
//                   firebaseUserId: true,
//                 },
//               },
//             },
//           },
//           lastMessage: true,
//           pinnedItems: true,
//         },
//         orderBy: {
//           lastActivity: "desc",
//         },
//       });

//       logger.debug({ conversations });
//       return {
//         success: true,
//         conversations: conversations,
//       };
//     }

//     // Calculate the offset for pagination
//     const skip = (page - 1) * size;
//     const take = Number(size);

//     // Fetch conversations where the user is a member, with pagination
//     const conversations = await prisma.conversation.findMany({
//       where: {
//         members: {
//           some: {
//             userId: userid,
//           },
//         },
//       },
//       include: {
//         members: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 userName: true,
//                 phone: true,
//                 profilePictureUrl: true,
//                 firebaseUserId: true,
//               },
//             },
//           },
//         },
//         lastMessage: true,
//         pinnedItems: true,
//       },
//       orderBy: {
//         lastActivity: "desc",
//       },
//       skip: skip,
//       take: take,
//     });

//     // Fetch total number of conversations for the user
//     const totalConversations = await prisma.conversation.count({
//       where: {
//         members: {
//           some: {
//             userId: userid,
//           },
//         },
//       },
//     });

//     // Calculate total pages
//     const totalPages = Math.ceil(totalConversations / size);

//     return {
//       success: true,
//       conversations,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         pageSize: size,
//         totalConversations: totalConversations,
//       },
//     };
//   } catch (error) {
//     throw error;
//   }
// };

//with pagination
// export const getConversationMessagesService = async (req, res) => {
//   try {
//     const { userid } = req.headers;
//     const { conversationId } = req.params;
//     const { page, size, messageId } = req.query; // Pagination parameters

//     // Define the base query for fetching messages
//     const messagesQuery = {
//       orderBy: {
//         createdAt: "desc", // Order messages by creation date, most recent first
//       },
//       select: {
//         id: true,
//         content: true,
//         photoUrl: true,
//         fileUrls: true,
//         status: true,
//         createdAt: true,
//         conversationId: true,
//         sender: {
//           select: {
//             id: true,
//             userName: true,
//             phone: true,
//             profilePictureUrl: true,
//             firebaseUserId: true,
//           },
//         },
//       },
//     };

//     // Modify the query based on messageId or pagination parameters
//     if (messageId) {
//       // Fetch messages from the given messageId onward
//       messagesQuery.where = {
//         id: {
//           gt: messageId,
//         },
//       };
//     } else if (page && size) {
//       // Apply pagination if page and size are provided
//       const skip = (page - 1) * size;
//       const take = Number(size);

//       messagesQuery.skip = skip;
//       messagesQuery.take = take;
//     }

//     // Fetch the conversation where the user is a member
//     const conversation = await prisma.conversation.findUnique({
//       where: {
//         id: conversationId,
//         members: {
//           some: {
//             userId: userid,
//           },
//         },
//       },
//       include: {
//         messages: messagesQuery,
//         lastMessage: true,
//         pinnedItems: true,
//       },
//     });

//     if (!conversation) {
//       throw new Error(`Conversation not found or you are not a member.`);
//     }

//     if (page && size && !messageId) {
//       // Fetch total number of messages in the conversation
//       const totalMessages = await prisma.message.count({
//         where: { conversationId: conversationId },
//       });

//       // Calculate total pages
//       const totalPages = Math.ceil(totalMessages / size);
//       return {
//         success: true,
//         conversation,
//         pagination: {
//           currentPage: page,
//           totalPages: totalPages,
//           pageSize: size,
//           totalMessages: totalMessages,
//         },
//       };
//     }

//     return {
//       success: true,
//       conversation,
//     };
//   } catch (error) {
//     throw error;
//   }
// };
