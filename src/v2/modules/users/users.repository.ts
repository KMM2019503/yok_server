import {
  addFcmTokenService,
  deleteUserService,
  fetchUserByPhoneNumberService,
  removeFcmTokenService,
  updateUserService,
} from "../../services/users.services.js";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";

export class UsersRepository {
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
