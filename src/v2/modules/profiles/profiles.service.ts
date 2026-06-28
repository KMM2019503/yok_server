import type { ProfilesRepository } from "./profiles.repository";
import type {
  ConfirmProfileTagsInput,
  ProfileResponse,
  PublicProfileResponse,
  SkipProfileInput,
  SubmitProfileStoryInput,
} from "./profiles.types";

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
}
