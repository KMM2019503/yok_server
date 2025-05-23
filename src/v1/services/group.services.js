import prisma from "../../../prisma/prismaClient";

import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";

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

export const getGroupMessageService = async (req) => {
  const { userid } = req.headers;
  const { groupId } = req.params;
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
      groupId: true,
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
      groupId,
      id: {
        lt: messageId,
      },
    };
  } else {
    messagesQuery.where = { channelId };
  }

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
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

  if (!group) {
    throw new Error(`Group not found or you are not a member.`);
  }

  return {
    success: true,
    group,
  };
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
        adminId: userid,
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

const updateGroupService = async (req) => {
  const { userId } = req.headers;
  const { groupId } = req.params;
  const { name, description, profilePictureUrl } = req.body;

  if (!userId || !groupId) {
    throw new Error("User ID and Group ID are required.");
  }

  // Validate input
  if (!name && !description && typeof isPublic !== "boolean") {
    throw new Error(
      "At least one field (name, description, or isPublic) must be provided for update."
    );
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, createdBy: true },
  });

  if (!group) {
    throw new Error("Group not found.");
  }

  if (group.createdBy !== userId) {
    throw new Error("You are not authorized to update this group.");
  }

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(profilePictureUrl && { profilePictureUrl }),
    },
  });

  io.to(groupId).emit("groupUpdated", {
    groupId,
    group: updatedGroup,
  });

  return { message: "Group updated successfully.", updatedGroup };
};

export const deleteGroupService = async (req) => {
  const { userid } = req.headers;
  const { groupId } = req.params;

  if (!userid) throw new Error("User ID is required.");
  if (!groupId) throw new Error("Group ID is required.");

  try {
    // Check if the group exists and is created by the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new Error("Group not found.");

    if (group.adminId !== userid) {
      throw new Error("You are not authorized to delete this group.");
    }

    // Delete all related records in a transaction
    await prisma.$transaction([
      // Delete all group memebers
      prisma.groupMember.delteMany({
        where: { groupId },
      }),

      // Delete all messages in the group
      prisma.message.deleteMany({
        where: { groupId: group.id },
      }),

      // Delete the group itself
      prisma.group.delete({
        where: { id: groupId },
      }),
    ]);
    io.to(groupId).emit("groupDeleted", {
      groupId,
    });
    return {
      message: "Group and all related data have been successfully deleted.",
      groupId,
    };
  } catch (error) {
    throw new Error(`Failed to delete group: ${error.message}`);
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
    io.to(groupId).emit("groupMembersJoined", {
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
  const { transferedUserId } = req.body;

  // Validate input
  if (!userid) {
    throw new Error("User  ID is required");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }

  try {
    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
        createdById: userid,
      },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new Error("Group not found.");
    }

    //this is the case that the creator of the group is leaving
    if (transferedUserId) {
      const updateGroup = await prisma.group.update({
        where: {
          id: groupId,
        },
        data: {
          adminId: transferedUserId,
        },
      });
    }

    // Attempt to remove the user from the group
    const deletedMember = await prisma.groupMember.deleteMany({
      where: {
        userId: userid,
        groupId: groupId,
      },
    });

    // Check if the user was actually a member
    if (deletedMember.count === 0) {
      throw new Error("User is not a member of this group");
    }

    // Emit an event to notify group members about the user leaving
    const memberSocketId = getReceiverSocketId(userid);
    if (memberSocketId) {
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

    const joinNewMembers = await prisma.groupMember.createMany({
      data: membersData,
    });

    const addedMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: newMembers },
      },
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
    });

    // Batch socket join operations
    const memberSocketIds = newMembers.map(getReceiverSocketId).filter(Boolean);
    memberSocketIds.forEach((socketId) => {
      io.sockets.sockets.get(socketId)?.join(groupId);
    });

    // Notify all users in the group room about the new members
    io.to(groupId).emit("groupMembersAdded", {
      groupId,
      newMembers: addedMembers,
    });

    return {
      success: true,
      newMembers: addedMembers,
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
  const { groupId, memberIds } = req.body; // ID of the group and IDs of the members to be removed

  // Validate input
  if (!userid) {
    throw new Error("User ID is required");
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
      throw new Error("Only the group creator can remove members");
    }

    // Check which members exist in the group in one query
    const existingMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: memberIds },
      },
      select: { userId: true },
    });

    const existingMemberIds = existingMembers.map((member) => member.userId);
    const membersToRemove = memberIds.filter((id) =>
      existingMemberIds.includes(id)
    );

    if (membersToRemove.length === 0) {
      return {
        success: true,
        message: "No members to remove, none are part of the group.",
      };
    }

    // Remove the members from the group
    await prisma.groupMember.deleteMany({
      where: {
        groupId: groupId,
        userId: { in: membersToRemove },
      },
    });

    // Notify all users in the group room about the removed members
    io.to(groupId).emit("membersRemoved", {
      groupId,
      removedMembers: membersToRemove,
    });

    // Batch socket leave operations
    const memberSocketIds = membersToRemove
      .map(getReceiverSocketId)
      .filter(Boolean);
    memberSocketIds.forEach((socketId) => {
      io.sockets.sockets.get(socketId)?.leave(groupId);
    });

    return {
      success: true,
      removedMembers: membersToRemove,
      message: "Members have been successfully removed from the group.",
    };
  } catch (error) {
    logger.error("Error removing members from group:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

export const getGroupService = async (req) => {
  try {
    const { userid } = req.headers;
    const { groupId } = req.params;

    logger.debug(req.headers);

    if (!userid) {
      throw new Error("User Id not found");
    }

    // Fetch conversations where the user is a member, with pagination
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
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
      group,
    };
  } catch (error) {
    throw error;
  }
};

export const getLatestMessagesInGroupsService = async (req) => {
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
            groupId: true,
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
      groups,
    };
  } catch (error) {
    throw error;
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
