import prisma from "../../shared/db/prisma";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors";
import type { FriendshipState, Pagination } from "./friends.types";

// The public-facing shape of a user when embedded in friend payloads.
const publicUserSelect = {
  id: true,
  userName: true,
  email: true,
  userUniqueID: true,
  profilePictureUrl: true,
  lastActiveAt: true,
} as const;

const DEFAULT_LIMIT = 20;

const buildPage = ({ cursor, limit }: Pagination) => {
  const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), 100);
  return {
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
};

const nextCursorFor = <T extends { id: string }>(items: T[], take: number) =>
  items.length === take ? items[items.length - 1].id : null;

export class FriendsRepository {
  // Atomically flip a request to ACCEPTED and create the two mirrored
  // friendship rows. Upserts keep it idempotent against races / re-runs.
  private becomeFriends(userA: string, userB: string, requestId: string) {
    return prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      }),
      prisma.friendship.upsert({
        where: { userId_friendId: { userId: userA, friendId: userB } },
        create: { userId: userA, friendId: userB },
        update: {},
      }),
      prisma.friendship.upsert({
        where: { userId_friendId: { userId: userB, friendId: userA } },
        create: { userId: userB, friendId: userA },
        update: {},
      }),
    ]);
  }

  async sendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<Record<string, unknown>> {
    if (senderId === receiverId) {
      throw new ValidationError("You cannot send a friend request to yourself.");
    }

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { blockedUserIds: true },
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, blockedUserIds: true },
      }),
    ]);

    if (!receiver) {
      throw new NotFoundError("User not found.");
    }

    if (
      sender?.blockedUserIds.includes(receiverId) ||
      receiver.blockedUserIds.includes(senderId)
    ) {
      throw new ForbiddenError("You cannot send a friend request to this user.");
    }

    const alreadyFriends = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId: senderId, friendId: receiverId } },
    });
    if (alreadyFriends) {
      throw new ConflictError("You are already friends with this user.");
    }

    // If the other person already sent us a pending request, accept it instead
    // of creating a competing one.
    const reverse = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: receiverId, receiverId: senderId },
      },
    });
    if (reverse && reverse.status === "PENDING") {
      await this.becomeFriends(senderId, receiverId, reverse.id);
      const friend = await prisma.user.findUnique({
        where: { id: receiverId },
        select: publicUserSelect,
      });
      return { success: true, status: "FRIENDS", autoAccepted: true, friend };
    }

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        throw new ConflictError("Friend request already sent.");
      }
      // Re-send over a previously rejected / cancelled request.
      const request = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING" },
        include: { receiver: { select: publicUserSelect } },
      });
      return { success: true, status: "PENDING", request };
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: { receiver: { select: publicUserSelect } },
    });
    return { success: true, status: "PENDING", request };
  }

  async listIncoming(
    userId: string,
    page: Pagination,
  ): Promise<Record<string, unknown>> {
    const { take, ...cursorOpts } = buildPage(page);
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take,
      ...cursorOpts,
    });
    return { success: true, requests, nextCursor: nextCursorFor(requests, take) };
  }

  async listOutgoing(
    userId: string,
    page: Pagination,
  ): Promise<Record<string, unknown>> {
    const { take, ...cursorOpts } = buildPage(page);
    const requests = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: { receiver: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take,
      ...cursorOpts,
    });
    return { success: true, requests, nextCursor: nextCursorFor(requests, take) };
  }

  async accept(
    userId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundError("Friend request not found.");
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenError("You can only accept requests sent to you.");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError("This friend request is no longer pending.");
    }

    await this.becomeFriends(request.senderId, request.receiverId, request.id);
    const friend = await prisma.user.findUnique({
      where: { id: request.senderId },
      select: publicUserSelect,
    });
    return { success: true, status: "FRIENDS", friend };
  }

  async reject(
    userId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundError("Friend request not found.");
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenError("You can only reject requests sent to you.");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError("This friend request is no longer pending.");
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
    return { success: true, status: "REJECTED" };
  }

  async cancel(
    userId: string,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundError("Friend request not found.");
    }
    if (request.senderId !== userId) {
      throw new ForbiddenError("You can only cancel requests you sent.");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError("This friend request is no longer pending.");
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });
    return { success: true, status: "CANCELLED" };
  }

  async listFriends(
    userId: string,
    page: Pagination,
    q?: string,
  ): Promise<Record<string, unknown>> {
    const { take, ...cursorOpts } = buildPage(page);
    const search = q?.trim();

    const friendships = await prisma.friendship.findMany({
      where: {
        userId,
        ...(search
          ? { friend: { is: { userName: { contains: search, mode: "insensitive" } } } }
          : {}),
      },
      include: { friend: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take,
      ...cursorOpts,
    });

    const friends = friendships.map((f) => ({
      friendshipId: f.id,
      friendsSince: f.createdAt,
      ...f.friend,
    }));

    return {
      success: true,
      friends,
      nextCursor: nextCursorFor(friendships, take),
    };
  }

  async unfriend(
    userId: string,
    friendId: string,
  ): Promise<Record<string, unknown>> {
    const result = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("You are not friends with this user.");
    }

    return { success: true, message: "Friend removed." };
  }

  async getStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Record<string, unknown>> {
    if (userId === targetUserId) {
      return { success: true, status: "SELF" satisfies FriendshipState };
    }

    const [me, target] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { blockedUserIds: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, blockedUserIds: true },
      }),
    ]);

    if (!target) {
      throw new NotFoundError("User not found.");
    }

    if (
      me?.blockedUserIds.includes(targetUserId) ||
      target.blockedUserIds.includes(userId)
    ) {
      return { success: true, status: "BLOCKED" satisfies FriendshipState };
    }

    const friendship = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: targetUserId } },
    });
    if (friendship) {
      return { success: true, status: "FRIENDS" satisfies FriendshipState };
    }

    const outgoing = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: userId, receiverId: targetUserId },
      },
    });
    if (outgoing?.status === "PENDING") {
      return {
        success: true,
        status: "REQUEST_OUTGOING" satisfies FriendshipState,
        requestId: outgoing.id,
      };
    }

    const incoming = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: targetUserId, receiverId: userId },
      },
    });
    if (incoming?.status === "PENDING") {
      return {
        success: true,
        status: "REQUEST_INCOMING" satisfies FriendshipState,
        requestId: incoming.id,
      };
    }

    return { success: true, status: "NONE" satisfies FriendshipState };
  }
}
