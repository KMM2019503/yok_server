import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { createChannelSchema } from "../validation/channel.validation";
import { ValidationError } from "../utils/validationErrors";

const prisma = new PrismaClient();

export const createChannelService = async (req) => {
  try {
    // Destructure the request to get userId and body
    const { userId, body } = req;

    console.log("🚀 ~ createChannelService ~ userId:", userId);

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
    const { userId } = req;
    const { page = 1, size = 15 } = req.params; // Default values for pagination

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

    // Fetch the channel details along with paginated messages
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
