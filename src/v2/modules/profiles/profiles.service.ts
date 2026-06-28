import type { ProfilesRepository } from "./profiles.repository";
import type {
  ConfirmProfileTagsInput,
  ProfileResponse,
  PublicProfileResponse,
  SkipProfileInput,
  SubmitProfileStoryInput,
  UpdateMyProfileBody,
  UpdateMyProfileInput,
  UpdateOwnUserInput,
} from "./profiles.types";

const toUserUpdates = (body: UpdateMyProfileBody): UpdateOwnUserInput | null => {
  const dateOfBirth =
    body.dateOfBirth !== undefined ? body.dateOfBirth : body.dob;

  const updates: UpdateOwnUserInput = {
    userName: body.userName,
    email: body.email,
    profilePictureUrl: body.profilePictureUrl,
    gender: body.gender,
    dateOfBirth,
  };

  const hasUpdates = Object.values(updates).some((value) => value !== undefined);
  return hasUpdates ? updates : null;
};

export class ProfilesService {
  constructor(private readonly repository: ProfilesRepository) {}

  submitStory(input: SubmitProfileStoryInput): Promise<ProfileResponse> {
    return this.repository.submitStory(input.userId, input.story);
  }

  confirmTags(input: ConfirmProfileTagsInput): Promise<ProfileResponse> {
    return this.repository.confirmTags(input.userId, input.tags);
  }

  skip(input: SkipProfileInput): Promise<ProfileResponse> {
    return this.repository.skip(input.userId);
  }

  getMine(userId: string): Promise<ProfileResponse> {
    return this.repository.getMine(userId);
  }

  getPublic(userId: string): Promise<PublicProfileResponse> {
    return this.repository.getPublic(userId);
  }

  async updateMine(input: UpdateMyProfileInput): Promise<ProfileResponse> {
    const userUpdates = toUserUpdates(input.body);

    if (userUpdates) {
      await this.repository.updateUserInfo(input.userId, userUpdates);
    }

    if (input.body.story !== undefined) {
      await this.repository.submitStory(input.userId, input.body.story);
    }

    if (input.body.tags !== undefined) {
      await this.repository.confirmTags(input.userId, input.body.tags);
    }

    return this.repository.getMine(input.userId);
  }
}
