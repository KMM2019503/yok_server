import type {
  DeleteUserInput,
  FcmTokenInput,
  NearbyUsersInput,
  PhoneLookupInput,
  RemoveLocationInput,
  SearchUsersInput,
  UpdateLocationInput,
  UpdateUserInput,
} from "./users.types";
import type { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  search(input: SearchUsersInput): Promise<Record<string, unknown>> {
    return this.repository.search(input.userId, input.query);
  }

  updateLocation(input: UpdateLocationInput): Promise<Record<string, unknown>> {
    return this.repository.updateLocation(
      input.userId,
      input.latitude,
      input.longitude,
    );
  }

  findNearby(input: NearbyUsersInput): Promise<Record<string, unknown>> {
    return this.repository.findNearby(
      input.userId,
      input.latitude,
      input.longitude,
      input.maxDistance,
    );
  }

  removeLocation(input: RemoveLocationInput): Promise<Record<string, unknown>> {
    return this.repository.removeLocation(input.userId);
  }

  update(input: UpdateUserInput): Promise<Record<string, unknown>> {
    return this.repository.update(input.userId, input.body);
  }

  delete(input: DeleteUserInput): Promise<Record<string, unknown>> {
    return this.repository.delete(input.userId, input.targetUserId);
  }

  findByPhone(input: PhoneLookupInput): Promise<Record<string, unknown>> {
    return this.repository.findByPhone(input.phoneNumber);
  }

  addFcmToken(input: FcmTokenInput): Promise<Record<string, unknown>> {
    return this.repository.addFcmToken(input.userId, input.fcmToken);
  }

  removeFcmToken(input: FcmTokenInput): Promise<Record<string, unknown>> {
    return this.repository.removeFcmToken(input.userId, input.fcmToken);
  }
}
