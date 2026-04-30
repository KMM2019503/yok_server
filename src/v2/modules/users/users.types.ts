export type UpdateUserInput = {
  userId: string;
  body: Record<string, unknown>;
};

export type DeleteUserInput = {
  userId: string;
  targetUserId: string;
};

export type PhoneLookupInput = {
  phoneNumber: string;
};

export type FcmTokenInput = {
  userId: string;
  fcmToken: string;
};
