//conversation.services.js

import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const getAllConversationsService = async (req) => {
  try {
    const { userid } = req.headers;

    logger.debug(req.headers);

    if (!userid) {
      throw new Error("User Id not found");
    }

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
                firebaseUserId: true,
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

    logger.debug({ conversations });

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
        createdAt: true,
        conversationId: true,
        sender: {
          select: {
            id: true,
            userName: true,
            phone: true,
            profilePictureUrl: true,
            firebaseUserId: true,
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

export const getConversationService = async (req) => {
  try {
    const { userid } = req.headers;

    logger.debug(req.headers);

    if (!userid) {
      throw new Error("User Id not found");
    }

    // Fetch conversations where the user is a member, with pagination
    const conversation = await prisma.conversation.findFirst({
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
                firebaseUserId: true,
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
                firebaseUserId: true,
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
            sender: {
              select: {
                id: true,
                userName: true,
                phone: true,
                profilePictureUrl: true,
                firebaseUserId: true,
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
