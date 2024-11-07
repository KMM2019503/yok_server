import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";

const prisma = new PrismaClient();

export const getAllGroupsService = async (req) => {
  const { userid } = req.headers; // Current user ID
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit to 10

  if (!userid) {
    throw new Error("User ID is required");
  }

  try {
    // Calculate the skip and take values for pagination
    const skip = (page - 1) * limit; // Calculate the number of items to skip
    const take = parseInt(limit, 10); // Limit number of items per page

    // Fetch groups with pagination
    const groups = await prisma.group.findMany({
      skip: skip,
      take: take,
      where: {
        // Optional filter for groups the user is a member of (or other conditions)
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
              },
            },
          },
        }, // Include members in the response
      },
    });

    // Count the total number of groups to calculate the total pages
    const totalGroups = await prisma.group.count({
      where: {
        members: {
          some: {
            userId: userid,
          },
        },
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalGroups / limit);

    // Return the paginated result
    return {
      success: true,
      message: "Groups fetched successfully",
      data: groups,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalGroups: totalGroups,
        limit: limit,
      },
    };
  } catch (error) {
    logger.error("Error fetching groups:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to fetch groups");
  }
};

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
        io.to(memberSocketId).emit("groupCreated", { name: newGroup.name });
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

export const joinGroupService = async (req) => {
  const { userid } = req.headers;
  const { groupId } = req.params;

  if (!userid) {
    throw new Error("User  ID is required");
  }

  try {
    // Attempt to add the user as a group member
    const newMember = await prisma.groupMember.create({
      data: {
        userId: userid,
        groupId: groupId,
      },
    });

    // Emit event to notify group members about the new member joining
    const memberSocketId = getReceiverSocketId(userid);
    if (memberSocketId) {
      io.to(memberSocketId).emit("groupJoined", { groupId, userId: userid });
      io.sockets.sockets.get(memberSocketId).join(groupId);
    }

    // Notify all users in the group room
    io.to(groupId).emit("newMemberJoined", {
      groupId,
      userId: userid,
    });

    return {
      success: true,
      message: "User  has successfully joined the group",
      data: newMember,
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("User  is already a member of this group");
    }

    logger.error("Error joining group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

export const leaveGroupService = async (req) => {
  const { userid } = req.headers;
  const { groupId } = req.params;

  // Validate input
  if (!userid) {
    throw new Error("User  ID is required");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }

  try {
    // Attempt to remove the user from the group
    const deletedMember = await prisma.groupMember.deleteMany({
      where: {
        userId: userid,
        groupId: groupId,
      },
    });

    // Check if the user was actually a member
    if (deletedMember.count === 0) {
      throw new Error("User  is not a member of this group");
    }

    // Emit an event to notify group members about the user leaving
    const memberSocketId = getReceiverSocketId(userid);
    if (memberSocketId) {
      // Emit to the user that they have left the group
      io.to(memberSocketId).emit("groupLeft", { groupId, userId: userid });
      // Remove the user from the group room
      io.sockets.sockets.get(memberSocketId)?.leave(groupId);
    }

    // Notify all users in the group room about the member leaving
    io.to(groupId).emit("memberLeft", {
      groupId,
      userId: userid,
    });

    return {
      success: true,
      message: "User  has successfully left the group",
    };
  } catch (error) {
    logger.error("Error leaving group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
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
