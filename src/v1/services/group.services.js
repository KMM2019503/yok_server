import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { io } from "../../../socket/Socket";

const prisma = new PrismaClient();

export const createGroupService = async (req) => {
  logger.info(`Group Create Process Started At ${new Date().toISOString()}`);
  const { userid } = req.headers; // Current user ID
  const { name, description, isPublic, profilePictureUrl, memberIds } =
    req.body; // Group details and additional member IDs

  if (!userid) {
    throw new Error("User ID is required");
  }

  if (!name) {
    throw new Error("Group name is required");
  }

  try {
    // Prepare the members data for Prisma create operation
    const membersData =
      memberIds && Array.isArray(memberIds)
        ? memberIds.map((id) => ({ userId: id }))
        : [];

    // Include the creator as a member
    membersData.push({ userId: userid });

    // Create the new group in the database
    logger.info(`Group Create Query Started At ${new Date().toISOString()}`);

    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        isPublic: isPublic || false, // Defaults to false if not provided
        profilePictureUrl,
        createdById: userid,
        members: {
          create: membersData, // Add multiple members including the creator
        },
      },
      include: {
        members: true, // Include members in the response
      },
    });
    logger.info(`Group Create Query Finished At ${new Date().toISOString()}`);


    // Emit a "createGroupRoom" event to Socket.IO
    io.emit("createGroupRoom", {
        groupId: newGroup.id,
        memberIds,
      });

    // Return the created group details
    return {
      success: true,
      message: "Group created successfully",
      data: newGroup,
    };
  } catch (error) {
    logger.error("Error creating group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to create group");
  }
};
