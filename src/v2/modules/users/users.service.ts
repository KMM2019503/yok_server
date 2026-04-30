import type {
  DeleteUserInput,
  FcmTokenInput,
  PhoneLookupInput,
  UpdateUserInput,
} from "./users.types";
import type { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

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
