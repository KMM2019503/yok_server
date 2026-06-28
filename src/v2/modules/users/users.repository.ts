import {
  addFcmTokenService,
  deleteUserService,
  fetchUserByPhoneNumberService,
  removeFcmTokenService,
  updateUserService,
} from "../../services/users.services.js";
import {
  deleteUserLocation,
  findNearUsers,
  updateUserLocation,
} from "../../services/location.services.js";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";
import prisma from "../../shared/db/prisma";

export class UsersRepository {
  updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<Record<string, unknown>> {
    updateUserLocation(userId, { latitude, longitude });
    return Promise.resolve({ success: true, message: "Location updated successfully." });
  }

  async findNearby(
    userId: string,
    latitude: number,
    longitude: number,
    maxDistance: number,
  ): Promise<Record<string, unknown>> {
    const result = await findNearUsers(
      userId,
      { latitude, longitude },
      maxDistance,
    );
    return { success: true, ...result };
  }

  removeLocation(userId: string): Promise<Record<string, unknown>> {
    deleteUserLocation(userId);
    return Promise.resolve({ success: true, message: "Location removed successfully." });
  }

  async search(
    currentUserId: string,
    query: string,
  ): Promise<Record<string, unknown>> {
    const q = query.trim();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { userName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { userUniqueID: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        userName: true,
        email: true,
        userUniqueID: true,
        profilePictureUrl: true,
        lastActiveAt: true,
      },
      orderBy: { userName: "asc" },
      take: 15,
    });

    return { success: true, users };
  }

  update(userId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body,
    });

    return updateUserService(request);
  }

  delete(userId: string, targetUserId: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      params: { userId: targetUserId },
    });

    return deleteUserService(request);
  }

  findByPhone(phoneNumber: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      params: { phoneNumber },
    });

    return fetchUserByPhoneNumberService(request);
  }

  addFcmToken(userId: string, fcmToken: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body: { fcmToken },
    });

    return addFcmTokenService(request);
  }

  removeFcmToken(userId: string, fcmToken: string): Promise<Record<string, unknown>> {
    const request = buildLegacyRequest({
      userId,
      body: { fcmToken },
    });

    return removeFcmTokenService(request);
  }
}
