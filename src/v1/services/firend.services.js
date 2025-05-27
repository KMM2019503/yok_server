import prisma from "../../../prisma/prismaClient";
import { getReceiverSocketId, io } from "../../../socket/Socket";

export const searchUsersService = async (req) => {
  const { query, page = 1, limit = 10 } = req.query;
  const userId = req.userid;

  if (!query || query.trim().length < 2) {
    throw new Error("Search query must be at least 2 characters long");
  }

  const searchTerm = query.trim().toLowerCase();
  const skip = (page - 1) * limit;

  // Check if query matches a userUniqueID exactly
  // if (/^[a-zA-Z0-9_-]{3,20}$/.test(searchTerm)) {
  //   const exactMatch = await prisma.user.findFirst({
  //     where: {
  //       OR: [
  //         { userUniqueID: { equals: searchTerm, mode: 'insensitive' } },
  //         { id: searchTerm } // In case someone searches by MongoDB ID
  //       ],
  //       NOT: { id: userId } // Exclude self
  //     },
  //     select: {
  //       id: true,
  //       userName: true,
  //       userUniqueID: true,
  //       profilePictureUrl: true,
  //       lastActiveAt: true
  //     }
  //   });

  //   if (exactMatch) {
  //     return {
  //       results: [exactMatch],
  //       page,
  //       limit,
  //       total: 1
  //     };
  //   }
  // }

  // Fuzzy search for usernames and emails
  const results = await prisma.user.findMany({
    where: {
      AND: [
        { NOT: { id: userId } }, // Exclude self
        {
          OR: [
            { userName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      userName: true,
      userUniqueID: true,
      profilePictureUrl: true,
      lastActiveAt: true,
      // Add other fields you want to return
    },
    take: limit,
    skip: skip,
    orderBy: [
      // Prioritize username matches first
      { userName: "asc" },
      // Then userUniqueID matches
      { userUniqueID: "asc" },
    ],
  });

  const total = await prisma.user.count({
    where: {
      AND: [
        { NOT: { id: userId } },
        {
          OR: [
            { userName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { userUniqueID: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ],
    },
  });

  return {
    results,
    page,
    limit,
    total,
    hasMore: skip + limit < total,
  };
};

export const sendFriendRequestService = async (req) => {
  const { receiverId } = req.body;
  const senderId = req.userid;

  if (senderId === receiverId) {
    throw new Error("You cannot send friend request to yourself");
  }

  // Check if friend request already exists
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new Error("Friend request already sent");
    }
    if (existingRequest.status === "ACCEPTED") {
      throw new Error("You are already friends");
    }
  }

  // Check if already friends
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: senderId, friendId: receiverId },
        { userId: receiverId, friendId: senderId },
      ],
    },
  });

  if (existingFriendship) {
    throw new Error("You are already friends");
  }

  // Create new friend request
  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: {
          id: true,
          userName: true,
          profilePictureUrl: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userName: true,
          profilePictureUrl: true,
          email: true,
        },
      },
    },
  });

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newFriendRequest", {
      message:
        "You have a new friend request From " + friendRequest.sender.userName,
      request: friendRequest,
    });
  }

  return {
    message: "Friend request sent successfully",
    friendRequest,
  };
};

const responseFriendRequestSocketService = (status, friendRequest) => {
  const { sender, receiver } = friendRequest;
  if(status === 'cancelled') {
    const receiverSocketId = getReceiverSocketId(friendRequest.receiver.id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendRequestResponse", {
        message: `${friendRequest.sender.userName} has cancelled his friend request`,
        friendRequest,
        status,
      });
    }
  } else {
    const senderSocketId = getReceiverSocketId(sender.id);

  if (senderSocketId) {
    io.to(senderSocketId).emit("friendRequestResponse", {
      message: `${friendRequest.receiver.userName} is ${status} your friend request`,
      friendRequest,
      status,
    });
  }
  }
};

export const acceptFriendRequestService = async (req) => {
  const { requestId } = req.body;
  const userId = req.userid;

  // Find the friend request
  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: {
        select: {
          id: true,
          userName: true,
          lastActiveAt: true,
          profilePictureUrl: true,
          userUniqueID: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userName: true,
          lastActiveAt: true,
          profilePictureUrl: true,
          userUniqueID: true,
        },
      },
    },
  });

  if (!friendRequest) {
    throw new Error("Friend request not found");
  }

  if (friendRequest.receiverId !== userId) {
    throw new Error("You can only accept requests sent to you");
  }

  if (friendRequest.status !== "PENDING") {
    throw new Error("Friend request is not pending");
  }

  return await prisma.$transaction(async (prisma) => {
    // Update the friend request status
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    // Check if friendship already exists to prevent duplicates
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
          {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        ],
      },
    });

    // Only create friendships if they don't exist
    if (existingFriendships.length === 0) {
      await Promise.all([
        prisma.friendship.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
        prisma.friendship.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
      ]);
    }

    responseFriendRequestSocketService("accepted", friendRequest);

    return {
      message: "Friend request accepted successfully",
      requestId: friendRequest.id,
      sender: friendRequest.sender,
    };
  });
};

export const rejectFriendRequestService = async (req) => {
  const { requestId } = req.body;
  const userId = req.userid;

  // Find the friend request with included user data
  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: {
        select: {
          id: true,
          userName: true,
          lastActiveAt: true,
          profilePictureUrl: true,
          userUniqueID: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userName: true,
          lastActiveAt: true,
          profilePictureUrl: true,
          userUniqueID: true,
        },
      },
    },
  });

  if (!friendRequest) {
    throw new Error("Friend request not found");
  }

  if (friendRequest.receiverId !== userId) {
    throw new Error("You can only reject requests sent to you");
  }

  if (friendRequest.status !== "PENDING") {
    throw new Error("Friend request is not pending");
  }

  // Use transaction for consistency
  return await prisma.$transaction(async (prisma) => {
    // Update the friend request status
    let response = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
      include: {
        sender: {
          select: {
            id: true,
            userName: true,
            lastActiveAt: true,
            profilePictureUrl: true,
            userUniqueID: true,
          },
        },
        receiver: {
          select: {
            id: true,
            userName: true,
            lastActiveAt: true,
            profilePictureUrl: true,
            userUniqueID: true,
          },
        },
      },
    });

    // Notify the sender about the rejection
    responseFriendRequestSocketService("rejected", response);

    return {
      message: "Friend request rejected successfully",
      requestId: friendRequest.id,
      sender: friendRequest.sender,
    };
  });
};

export const cancelFriendRequestService = async (req) => {
  const { requestId } = req.body;
  const userId = req.userid;

  // Find the friend request with included user data
  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: {
        select: {
          id: true,
          userName: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userName: true,
          email: true,
        },
      },
    },
  });

  if (!friendRequest) {
    throw new Error("Friend request not found");
  }

  if (friendRequest.sender.id !== userId) {
    throw new Error("You can only cancel requests you sent");
  }

  if (friendRequest.status !== "PENDING") {
    throw new Error("Friend request is not pending");
  }

  // Use transaction for consistency
  return await prisma.$transaction(async (prisma) => {
    // Update the friend request status
    let request = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
      include: {
        sender: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
      },
    });

    // Notify the receiver about the cancellation
    responseFriendRequestSocketService("cancelled", request);

    return {
      message: "Friend request cancelled successfully",
      request: request
    };
  });
};

export const getFriendRequestsService = async (req) => {
  const userId = req.userid;
  // const { type = "received" } = req.query;

  const requests = await prisma.friendRequest.findMany({
    // where: {
    //   ...(type === "received" ? { receiverId: userId } : { senderId: userId }),
    //   status: "PENDING",
    // },
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: {
          id: true,
          userName: true,
          profilePictureUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("🚀 ~ getFriendRequestsService ~ requests:", requests);
  return {
    requests,
    count: requests.length,
  };
};

export const getOutgoingFriendRequestService = async (req) => {
  const userId = req.userid;

  const requests = await prisma.friendRequest.findMany({
    where: { senderId: userId },
    include: {
      receiver: {
        select: {
          id: true,
          userName: true,
          profilePictureUrl: true,
        },
      },
    },
  });

  return requests;
};

export const getFriendsListService = async (req) => {
  const userId = req.userid;

  const friends = await prisma.friendship.findMany({
    where: { userId: userId },
    include: {
      friend: {
        select: {
          id: true,
          userName: true,
          userUniqueID: true,
          profilePictureUrl: true,
          lastActiveAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("🚀 ~ getFriendsListService ~ friends:", friends);

  return {
    friends: friends.map((f) => f.friend),
    count: friends.length,
  };
};

export const removeFriendService = async (req) => {
  const userId = req.userId;
  const { friendId } = req.body;

  // Delete both directions of the friendship
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  // Update any existing friend requests between these users to REJECTED
  await prisma.friendRequest.updateMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
    data: { status: "REJECTED" },
  });

  return {
    message: "Friend removed successfully",
  };
};
