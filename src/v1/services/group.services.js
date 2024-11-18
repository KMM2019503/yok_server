import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";

const prisma = new PrismaClient();

// MongoDB URI (Ensure it's correct for your setup)
const uri = process.env.DATABASE_URL; // Set this in your .env file for MongoDB URI

export const findGroupByNameService = async (req) => {
  const { groupName } = req.query;
  const { userid } = req.headers; // Current user ID

  if (!groupName) {
    throw new Error("Group name is required");
  }

  try {
    // Run the MongoDB Atlas Search query using Prisma's $runCommandRaw
    const result = await prisma.$runCommandRaw({
      aggregate: "groups", // Specify the collection name
      pipeline: [
        {
          $search: {
            index: "default", // Use your actual Atlas Search index name
            text: {
              query: groupName,
              path: "name", // Field to search in
              fuzzy: {}, // Enable fuzzy search if needed
            },
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            isPublic: 1,
            profilePictureUrl: 1,
          },
        },
      ],
      cursor: {},
    });

    // Check if any groups were found
    if (result.cursor.firstBatch.length === 0) {
      return {
        success: false,
        message: "No groups found matching the name",
      };
    }

    // Filter out private groups if necessary (check access for the user)
    const groups = result.cursor.firstBatch.filter((group) => group.isPublic);

    return {
      success: true,
      message: "Groups found successfully",
      data: groups,
    };
  } catch (error) {
    logger.error("Error finding groups by name with Atlas Search:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to find groups by name");
  }
};

export const getAllGroupsService = async (req) => {
  const { userid } = req.headers; // Current user ID

  if (!userid) {
    throw new Error("User ID is required");
  }

  try {
    // Fetch all groups where the user is a member
    const groups = await prisma.group.findMany({
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
                firebaseUserId: true,
              },
            },
          },
        }, // Include members in the response
      },
      orderBy: {
        lastActivity: "desc",
      },
    });

    // Return the result without pagination
    return {
      success: true,
      message: "Groups fetched successfully",
      groups: groups,
    };
  } catch (error) {
    logger.error("Error fetching groups:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to fetch groups");
  }
};

// with pagination
// export const getAllGroupsService = async (req) => {
//   const { userid } = req.headers; // Current user ID
//   const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit to 10

//   if (!userid) {
//     throw new Error("User ID is required");
//   }

//   try {
//     // Calculate the skip and take values for pagination
//     const skip = (page - 1) * limit; // Calculate the number of items to skip
//     const take = parseInt(limit, 10); // Limit number of items per page

//     // Fetch groups with pagination
//     const groups = await prisma.group.findMany({
//       skip: skip,
//       take: take,
//       where: {
//         // Optional filter for groups the user is a member of (or other conditions)
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
//                 firebaseUserId: true,
//               },
//             },
//           },
//         }, // Include members in the response
//       },
//     });

//     // Count the total number of groups to calculate the total pages
//     const totalGroups = await prisma.group.count({
//       where: {
//         members: {
//           some: {
//             userId: userid,
//           },
//         },
//       },
//     });

//     // Calculate the total number of pages
//     const totalPages = Math.ceil(totalGroups / limit);

//     // Return the paginated result
//     return {
//       success: true,
//       message: "Groups fetched successfully",
//       data: groups,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalGroups: totalGroups,
//         limit: limit,
//       },
//     };
//   } catch (error) {
//     logger.error("Error fetching groups:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     throw new Error("Failed to fetch groups");
//   }
// };

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
    io.to(newGroup.id).emit("newGroupCreated", newGroup);

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

export const addMemberToGroupService = async (req) => {
  const { userid } = req.headers; // ID of the user making the request
  const { groupId, memberIds } = req.body; // ID of the group and IDs of the new members to be added

  // Validate input
  if (!userid) {
    throw new Error("User  ID is required");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("A list of member IDs is required");
  }

  try {
    // Check if the current user is the creator of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { createdById: true },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    if (group.createdById !== userid) {
      throw new Error("Only the group creator can add members");
    }

    // Check existing members in one query
    const existingMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: memberIds },
      },
      select: { userId: true },
    });

    const existingMemberIds = existingMembers.map((member) => member.userId);
    const newMembers = memberIds.filter(
      (id) => !existingMemberIds.includes(id)
    );

    if (newMembers.length === 0) {
      return {
        success: true,
        message: "No new members to add, all members are already in the group.",
      };
    }

    // Prepare the members data for Prisma createMany operation
    const membersData = newMembers.map((id) => ({
      userId: id,
      groupId: groupId,
    }));

    // Add new members to the group in a single transaction
    await prisma.$transaction(async (prisma) => {
      await prisma.groupMember.createMany({
        data: membersData,
      });
    });

    // Batch socket join operations
    const memberSocketIds = newMembers.map(getReceiverSocketId).filter(Boolean);
    memberSocketIds.forEach((socketId) => {
      io.sockets.sockets.get(socketId)?.join(groupId);
    });

    // Notify all users in the group room about the new members
    io.to(groupId).emit("membersAdded", {
      groupId,
      newMemberIds: newMembers,
    });

    return {
      success: true,
      message: "Members have been successfully added to the group",
    };
  } catch (error) {
    logger.error("Error adding members to group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

export const removeMemberFromGroupService = async (req) => {
  const { userid } = req.headers; // ID of the user making the request
  const { groupId, memberId } = req.body; // ID of the group and ID of the member to be removed

  // Validate input
  if (!userid) {
    throw new Error("User  ID is required");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }
  if (!memberId) {
    throw new Error("Member ID is required");
  }

  try {
    // Check if the current user is the creator of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { createdById: true },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    if (group.createdById !== userid) {
      throw new Error("Only the group creator can remove members");
    }

    // Check if the member exists in the group
    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId: groupId,
        },
      },
    });

    if (!member) {
      throw new Error("Member not found in this group");
    }

    // Remove the member from the group
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId: groupId,
        },
      },
    });

    // Notify all users in the group room about the member leaving
    io.to(groupId).emit("memberRemoved", {
      groupId,
      memberId,
    });

    // Optionally, if you want to remove the member from the socket room
    const memberSocketId = getReceiverSocketId(memberId);
    if (memberSocketId) {
      io.sockets.sockets.get(memberSocketId)?.leave(groupId);
    }

    return {
      success: true,
      message: "Member has been successfully removed from the group",
    };
  } catch (error) {
    logger.error("Error removing member from group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};
