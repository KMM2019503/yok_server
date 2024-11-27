import prisma from "../../../prisma/prismaClient";
import { getReceiverSocketId, io } from "../../../socket/Socket";
import logger from "../utils/logger";
import { createChannelSchema } from "../validation/channel.validation";

export const createChannelService = async (req) => {
  try {
    // Destructure the request to get userId and body
    const { body } = req;
    const { userid } = req.headers;

    // Validate the incoming data using Joi schema
    const { error } = createChannelSchema.validate(body, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      throw new ValidationError(validationErrors.join(", "));
    }

    // Destructure channel information from the body
    const { name, description, isPublic, profilePictureUrl, adminIds } = body;

    const membersData =
      adminIds && Array.isArray(adminIds)
        ? adminIds.map((id) => ({ userId: id }))
        : [];

    membersData.push({ userId: userid });

    // Create a new channel with Prisma
    const newChannel = await prisma.channel.create({
      data: {
        name,
        description,
        isPublic: isPublic ?? true, // Use the provided value or default to true
        profilePictureUrl,
        createdById: userid,
        superAdminId: userid,
        adminIds: adminIds ?? [], // Use an empty array if no admin IDs are provided
        lastActivity: new Date(),
        members: {
          create: membersData, // Add multiple members including the creator
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
                firebaseUserId: true,
              },
            },
          },
        }, // Include members in the response
      },
    });

    logger.info(`Channel created successfully: ${newChannel.id}`);

    newChannel.members.forEach((member) => {
      const memberSocketId = getReceiverSocketId(member.userId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("channelCreated", { name: newChannel.name });
        io.sockets.sockets.get(memberSocketId).join(newChannel.id);
      }
    });

    io.to(newChannel.id).emit("newChannelCreated", newChannel);

    return {
      success: true,
      channel: newChannel,
    };
  } catch (error) {
    // Handle any errors during the process
    logger.error("🚀 ~ createChannelService ~ error:", error);
    throw error;
  }
};

export const getAllChannelsService = async (req) => {
  try {
    const { userid } = req.headers;
    const { isSuperAdmin, isAdmin } = req.params; // Removed pagination parameters

    if (!userid) {
      throw new Error("User ID is required");
    }
    // Build the filter conditions
    const conditions = {
      members: { some: { userId: userid } },
    };

    // If filtering by superAdmin, add the condition
    if (isSuperAdmin) {
      conditions.superAdminId = userid;
    }

    // If filtering by admin, add the condition
    if (isAdmin) {
      conditions.adminIds = { has: userid };
    }

    // Fetch all channels without pagination
    const channels = await prisma.channel.findMany({
      where: conditions,
      orderBy: {
        lastActivity: "desc",
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                phone: true,
                firebaseUserId: true,
              },
            },
          },
        },
      },
    });
    console.log("🚀 ~ getAllChannelsService ~ channels:", channels);

    // Return the list of channels associated with the user
    return {
      success: true,
      channels,
    };
  } catch (error) {
    // Handle any errors during the process
    logger.error("🚀 ~ getAllChannelsService ~ error:", error);
    throw error;
  }
};

export const getChannelMessagesServices = async (req) => {
  try {
    const { userid } = req.headers;
    const { channelId } = req.params;
    const { messageId, take } = req.query;
    const messagesQuery = {
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(take) || 25,
      select: {
        id: true,
        content: true,
        photoUrl: true,
        fileUrls: true,
        status: true,
        createdAt: true,
        channelId: true,
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
        channelId,
        id: {
          lt: messageId,
        },
      };
    } else {
      messagesQuery.where = { channelId };
    }

    const channel = await prisma.channel.findUnique({
      where: {
        id: channelId,
        members: {
          some: { userId: userid },
        },
      },
      include: {
        messages: messagesQuery,
        lastMessage: true,
        pinnedItems: true,
      },
    });

    return {
      success: true,
      channel,
    };
  } catch (error) {
    logger.error("🚀 ~ getChannel ~ error:", error);
    throw error;
  }
};

export const updateChannelService = async (req) => {
  try {
    const { channelId, body } = req;

    // Validate the incoming data using Joi schema
    const { error } = updateChannelSchema.validate(body, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      logger.error("🚀 ~ updateChannelService ~ validation error:", error);
      throw new ValidationError(validationErrors.join(", "));
    }

    // Check if the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Destructure the data to update
    const { name, description, isPublic, profilePictureUrl } = body;

    // Update the channel with the provided data
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(profilePictureUrl && { profilePictureUrl }),
      },
    });

    // return updatedChannel;
    return {
      success: true,
      channel: updatedChannel,
    };
  } catch (error) {
    logger.error("🚀 ~ updateChannelService ~ error:", error);
    throw error;
  }
};

export const addAdminService = async (req) => {
  try {
    const { body, channelId } = req;
    const { adminIds } = body;

    if (!adminIds || adminIds.length === 0) {
      throw new Error("No admin IDs provided");
    }

    // Check if the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { adminIds: true },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Filter out admin IDs that are already present in the existing array
    const newAdminIds = adminIds.filter(
      (adminId) => !channel.adminIds.includes(adminId)
    );

    if (newAdminIds.length === 0) {
      throw new Error("All provided users are already admins");
    }

    // Add the new admin IDs to the existing adminIds array
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        adminIds: {
          push: newAdminIds, // Use the push operator to add newAdminIds array to the existing adminIds
        },
      },
    });

    // Add new admins as channel members if they are not already members
    await Promise.all(
      newAdminIds.map(async (adminId) => {
        const isMember = await prisma.channelMember.findUnique({
          where: {
            userId_channelId: {
              userId: adminId,
              channelId: channelId,
            },
          },
        });

        if (!isMember) {
          await prisma.channelMember.create({
            data: {
              userId: adminId,
              channelId: channelId,
              joinedAt: new Date(),
            },
          });
        }
      })
    );

    logger.info(
      `Admins added successfully: ${newAdminIds} to channel ${channelId}`
    );
    return {
      success: true,
      channel: updatedChannel,
    };
  } catch (error) {
    logger.error("Error in addAdminService:", error);
    throw error;
  }
};

export const removeAdminService = async (req) => {
  try {
    const { body, channelId } = req;
    const { adminIds } = body;

    // Check if the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { adminIds: true },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Filter out admin IDs that are present in the existing array
    const updatedAdminIds = channel.adminIds.filter(
      (id) => !adminIds.includes(id)
    );

    if (updatedAdminIds.length === channel.adminIds.length) {
      throw new Error("None of the provided users are currently admins");
    }

    // Update the channel with the new adminIds array
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        adminIds: updatedAdminIds,
      },
    });

    logger.info(
      `Admins removed successfully: ${adminIds} from channel ${channelId}`
    );
    return {
      success: true,
      channel: updatedChannel,
    };
  } catch (error) {
    throw error;
  }
};

export const deleteChannelService = async (req) => {
  try {
    const { channelId } = req.params;

    // Check if the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Delete associated members first to maintain data integrity
    await prisma.channelMember.deleteMany({
      where: { channelId: channelId },
    });

    // Delete associated messages
    await prisma.message.deleteMany({
      where: { channelId: channelId },
    });

    // Finally, delete the channel itself
    const deletedChannel = await prisma.channel.delete({
      where: { id: channelId },
    });

    logger.info(`Channel deleted successfully: ${channelId}`);
    return {
      success: true,
      channel: deletedChannel,
    };
  } catch (error) {
    logger.error("🚀 ~ deleteChannelService ~ error:", error);
    throw error;
  }
};

export const addMemberToChannelService = async (req) => {
  try {
    const { userid } = req.headers;
    const { channelId, userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("Invalid or empty user IDs array provided");
    }

    // Check if the channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { adminIds: true, superAdminId: true },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check if the current user is an admin or super admin
    const isSuperAdmin = channel.superAdminId === userid;
    const isAdmin = channel.adminIds.includes(userid);

    if (!isSuperAdmin && !isAdmin) {
      throw new Error(
        "You do not have permission to add members to this channel"
      );
    }

    // Filter out user IDs that are already members
    const existingMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });

    const existingMemberIds = existingMembers.map((member) => member.userId);
    const newMemberIds = userIds.filter(
      (userId) => !existingMemberIds.includes(userId)
    );

    if (newMemberIds.length === 0) {
      throw new Error("All provided users are already members of this channel");
    }

    // Add the new members to the channel
    const channelMembersData = newMemberIds.map((userId) => ({
      userId,
      channelId,
      joinedAt: new Date(),
    }));

    await prisma.channelMember.createMany({
      data: channelMembersData,
    });

    logger.info(
      `Members added successfully: ${newMemberIds} to channel ${channelId}`
    );

    return {
      success: true,
      message: "Members added successfully",
      newMembers: newMemberIds,
    };
  } catch (error) {
    logger.error("🚀 ~ addMemberToChannel ~ error:", error);
    throw error;
  }
};

export const removeMemberFromChannelService = async (req) => {
  try {
    const { userid } = req.headers; // Current user's ID
    const { channelId, userIds } = req.body; // Channel ID and array of user IDs to remove

    // Validate input
    if (!userIds || userIds.length === 0) {
      throw new Error("No user IDs provided");
    }

    // Check if the current user is an admin or super admin of the channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { adminIds: true, superAdminId: true },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const { adminIds, superAdminId } = channel;

    if (superAdminId !== userid && !adminIds.includes(userid)) {
      throw new Error(
        "You do not have permission to remove members from this channel"
      );
    }

    // Prevent removing super admin from the channel
    if (userIds.includes(superAdminId)) {
      throw new Error("Cannot remove the super admin from the channel");
    }

    // Remove members from the channel
    const removedMembers = await prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId: { in: userIds },
      },
    });

    if (removedMembers.count === 0) {
      throw new Error("None of the provided users are members of the channel");
    }

    logger.info(
      `Members removed successfully: ${userIds} from channel ${channelId}`
    );

    return {
      success: true,
      message: "Members removed successfully",
    };
  } catch (error) {
    logger.error("🚀 ~ removeMemberFromChannel ~ error:", error);
    throw error;
  }
};

export const joinMemberToChannelService = async (req) => {
  try {
    const { userid } = req.headers; // ID of the current user
    const { channelId } = req.body; // ID of the channel to join

    if (!userid) {
      throw new Error("User ID is required");
    }
    // Validate input
    if (!channelId) {
      throw new Error("Channel ID is required");
    }

    // Check if the channel exists and is public
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { isPublic: true },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    if (!channel.isPublic) {
      throw new Error("Cannot join a private channel without an invitation");
    }

    await prisma.channelMember.create({
      data: {
        userId: userid,
        channelId: channelId,
        joinedAt: new Date(),
      },
    });

    logger.info(
      `User ${userid} successfully joined public channel ${channelId}`
    );

    return {
      success: true,
      message: "Successfully joined the channel",
    };
  } catch (error) {
    logger.error("🚀 ~ joinMemberToChannelService ~ error:", error);
    throw error;
  }
};

export const leaveMemberFromChannelService = async (req) => {
  try {
    const { userid } = req.headers; // ID of the current user
    const { channelId } = req.body; // ID of the channel to leave

    if (!userid) {
      throw new Error("User ID is required");
    }

    // Validate input
    if (!channelId) {
      throw new Error("Channel ID is required");
    }

    // Check if the member exists in the channel
    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId: userid,
          channelId: channelId,
        },
      },
    });

    if (!member) {
      throw new Error("You are not a member of this channel");
    }

    // Remove the member from the channel
    await prisma.channelMember.delete({
      where: {
        userId_channelId: {
          userId: userid,
          channelId: channelId,
        },
      },
    });

    // Remove the user from the channel's admin list if they are an admin
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { adminIds: true },
    });

    if (channel && channel.adminIds.includes(userid)) {
      const updatedAdminIds = channel.adminIds.filter((id) => id !== userid);

      await prisma.channel.update({
        where: { id: channelId },
        data: {
          adminIds: updatedAdminIds,
        },
      });

      logger.info(
        `User ${userid} was removed from admin list of channel ${channelId}`
      );
    }

    logger.info(`User ${userid} successfully left channel ${channelId}`);

    return {
      success: true,
      message: "Successfully left the channel",
    };
  } catch (error) {
    logger.error("🚀 ~ leaveMemberFromChannelService ~ error:", error);
    throw error;
  }
};

export const getChannelService = async (req) => {
  try {
    const { userid } = req.headers;

    logger.debug(req.headers);

    if (!userid) {
      throw new Error("User Id not found");
    }

    const channel = await prisma.channel.findFirst({
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
      },
    });

    return {
      success: true,
      channel,
    };
  } catch (error) {
    throw error;
  }
};

export const getLatestMessagesInChannelsService = async (req) => {
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

    const channels = await prisma.channel.findMany({
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
            channel: true,
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
      channels,
    };
  } catch (error) {
    throw error;
  }
};

//with pagination
// export const getAllChannelsService = async (req) => {
//   try {
//     const { userid } = req.headers;
//     const { page = 1, size = 15, isSuperAdmin, isAdmin } = req.params; // Default values for pagination

//     // Calculate offset for pagination
//     const skip = (page - 1) * size;

//     // Build the filter conditions
//     const conditions = {
//       members: { some: { userId: userid } },
//     };

//     // If filtering by superAdmin, add the condition
//     if (isSuperAdmin) {
//       conditions.superAdminId = userid;
//     }

//     // If filtering by admin, add the condition
//     if (isAdmin) {
//       conditions.adminIds = { has: userid };
//     }

//     const channels = await prisma.channel.findMany({
//       where: conditions,
//       skip: skip, // Skip calculated number of records
//       take: Number(size), // Limit number of records returned
//     });

//     // Return the paginated list of channels associated with the user
//     return channels;
//   } catch (error) {
//     // Handle any errors during the process
//     logger.error("🚀 ~ getAllChannelsService ~ error:", error);
//     throw error;
//   }
// };
