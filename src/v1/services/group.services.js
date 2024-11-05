import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";

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
        profilePictureUrl: profilePictureUrl || "example.profile.picture",
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

    // Add the creator and members to the room during group creation
    newGroup.members.forEach((member) => {
      const memberSocketId = getReceiverSocketId(member.userId);
      if (memberSocketId) {
        io.sockets.sockets.get(memberSocketId).join(newGroup.id);
      }
    });

    // Notify all users in the group room of the new group creation
    io.to(newGroup.id).emit("newGroupCreated", {
      groupId: newGroup.id,
      name: newGroup.name,
      createdById: userid,
      members: newGroup.members.map((m) => m.userId),
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

// export const createGroupService = async (req) => {
//   logger.info(`Group Create Process Started At ${new Date().toISOString()}`);
//   const { userid } = req.headers; // Current user ID
//   const { name, description, isPublic, profilePictureUrl, memberIds } =
//     req.body; // Group details and additional member IDs

//   if (!userid) {
//     throw new Error("User ID is required");
//   }

//   if (!name) {
//     throw new Error("Group name is required");
//   }

//   try {
//     // Prepare the members data for Prisma create operation
//     const membersData =
//       memberIds && Array.isArray(memberIds)
//         ? memberIds.map((id) => ({ userId: id }))
//         : [];

//     // Include the creator as a member
//     membersData.push({ userId: userid });

//     // Create the new group in the database
//     logger.info(`Group Create Query Started At ${new Date().toISOString()}`);

//     const newGroup = await prisma.group.create({
//       data: {
//         name,
//         description,
//         isPublic: isPublic || false, // Defaults to false if not provided
//         profilePictureUrl: profilePictureUrl || "example.profile.picture",
//         createdById: userid,
//         members: {
//           create: membersData, // Add multiple members including the creator
//         },
//       },
//       include: {
//         members: true, // Include members in the response
//       },
//     });
//     logger.info(`Group Create Query Finished At ${new Date().toISOString()}`);

//     // Emit a "createGroupRoom" event to Socket.IO
//     io.emit("createGroupRoom", {
//       groupId: newGroup.id,
//       memberIds,
//     });

//     // Return the created group details
//     return {
//       success: true,
//       message: "Group created successfully",
//       data: newGroup,
//     };
//   } catch (error) {
//     logger.error("Error creating group:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     throw new Error("Failed to create group");
//   }
// };

export const joinGroupService = async (req) => {
  const { userid } = req.headers; // Current user ID
  const { groupId } = req.params; // Group ID to join

  if (!userid) {
    throw new Error("User ID is required");
  }

  try {
    // Check if the group exists and is public
    // const group = await prisma.group.findUnique({
    //   where: { id: groupId },
    //   select: { isPublic: true },
    // });

    // if (!group) {
    //   return {
    //     success: false,
    //     message: "Group not found",
    //   };
    // }

    // if (!group.isPublic) {
    //   return {
    //     success: false,
    //     message: "Group is not public",
    //   };
    // }

    // Upsert to add user as a group member if not already added
    const result = await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          // Unique compound key for group membership
          groupId: groupId,
          userId: userid,
        },
      },
      update: {}, // Leave empty because we don't want to update if it exists
      create: {
        userId: userid,
        groupId: groupId,
        joinedAt: new Date(),
      },
    });

    if (!result) {
      return {
        success: false,
        message: "User is already a member of this group",
      };
    }

    // Emit a "joinGroupRoom" event to Socket.IO
    // io.emit("joinGroupRoom", {
    //   groupId,
    //   userId: userid,
    // });

    // Return a success response
    return {
      success: true,
      message: "User has successfully joined the group",
    };
  } catch (error) {
    logger.error("Error joining group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to join group");
  }
};
