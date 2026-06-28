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

export type SearchUsersInput = {
  userId: string;
  query: string;
};

export type UpdateLocationInput = {
  userId: string;
  latitude: number;
  longitude: number;
};

export type NearbyUsersInput = {
  userId: string;
  latitude: number;
  longitude: number;
  maxDistance: number;
};

export type RemoveLocationInput = {
  userId: string;
};

export type FcmTokenInput = {
  userId: string;
  fcmToken: string;
};
