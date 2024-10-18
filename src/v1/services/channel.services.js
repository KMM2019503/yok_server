import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import {
  createChannelSchema,
  updateChannelSchema,
} from "../validation/channel.validation";
import { ValidationError } from "../utils/validationErrors";

const prisma = new PrismaClient();

export const createChannelService = async (req) => {
  try {
    // Destructure the request to get userId and body
    const { userId, body } = req;

    // Validate the incoming data using Joi schema
    const { error } = createChannelSchema.validate(body, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      logger.error("🚀 ~ createChannelService ~ error:", error);
      throw new ValidationError(validationErrors.join(", "));
    }

    // Destructure channel information from the body
    const { name, description, isPublic, profilePictureUrl, adminIds } = body;

    // Create a new channel with Prisma
    const newChannel = await prisma.channel.create({
      data: {
        name,
        description,
        isPublic: isPublic ?? true, // Use the provided value or default to true
        profilePictureUrl,
        createdById: userId,
        superAdminId: userId,
        adminIds: adminIds ?? [], // Use an empty array if no admin IDs are provided
        lastActivity: new Date(),
      },
    });

    logger.info(`Channel created successfully: ${newChannel.id}`);

    const channelMembersData = [
      {
        userId,
        channelId: newChannel.id,
        joinedAt: new Date(),
      },
    ];

    // If adminIds are provided, add them as channel members
    if (adminIds && adminIds.length > 0) {
      adminIds.forEach((adminId) => {
        channelMembersData.push({
          userId: adminId,
          channelId: newChannel.id,
          joinedAt: new Date(),
        });
      });
    }

    // Add all members to the ChannelMember table
    await prisma.channelMember.createMany({
      data: channelMembersData,
    });

    // Fetch the channel with members information included
    const channel = await prisma.channel.findUnique({
      where: { id: newChannel.id },
    });

    // Return the newly created channel with members
    return channel;
  } catch (error) {
    // Handle any errors during the process
    logger.error("🚀 ~ createChannelService ~ error:", error);
    throw error;
  }
};

export const getAllChannelsService = async (req) => {
  try {
    console.log("🚀 ~ running getAllChannelsService");
    const { userId } = req;
    const { page = 1, size = 15 } = req.params; // Default values for pagination

    console.log("Running getAllChannelsService with userId:", userId);

    // Calculate offset for pagination
    const skip = (page - 1) * size;

    const channels = await prisma.channel.findMany({
      where: {
        members: { some: { userId: userId } },
      },
      skip: skip, // Skip calculated number of records
      take: Number(size), // Limit number of records returned
    });

    // Return the paginated list of channels associated with the user
    return channels;
  } catch (error) {
    // Handle any errors during the process
    logger.error("🚀 ~ getAllChannelsService ~ error:", error);
    throw error;
  }
};

export const getChannel = async (req) => {
  try {
    const { channelId } = req.params;
    const { page = 1, size = 15 } = req.query; // Pagination parameters

    // Calculate the offset for pagination
    const skip = (page - 1) * size;
    const take = Number(size);

    console.log("running getChannelService");

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        messages: {
          select: {
            id: true,
            content: true,
            photoUrl: true,
            fileUrls: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
              },
            },
          },
          skip: skip,
          take: take,
          orderBy: {
            createdAt: "desc", // Order messages by creation date, most recent first
          },
        },
      },
    });

    // Fetch total number of messages in the channel
    const totalMessages = await prisma.message.count({
      where: { channelId: channelId },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalMessages / size);

    // Return the channel with paginated message data and pagination info
    return {
      channel,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        pageSize: size,
        totalMessages: totalMessages,
      },
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

    logger.info(`Channel updated successfully: ${channelId}`);
    return updatedChannel;
  } catch (error) {
    logger.error("🚀 ~ updateChannelService ~ error:", error);
    throw error;
  }
};

export const addAdminService = async (req) => {
  try {
    const { body, channelId } = req;
    const { adminIds } = body; // Get adminIds array from the request body

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
    return updatedChannel;
  } catch (error) {
    logger.error("Error in addAdminService:", error);
    throw error;
  }
};

export const removeAdminService = async (req) => {
  try {
    const { body, channelId } = req;
    const { adminIds } = body; // Get adminIds array from the request body

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
    return updatedChannel;
  } catch (error) {
    logger.error("Error in removeAdminService:", error);
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
    return deletedChannel;
  } catch (error) {
    logger.error("🚀 ~ deleteChannelService ~ error:", error);
    throw error;
  }
};
