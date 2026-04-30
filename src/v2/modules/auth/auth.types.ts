export type LoginBody = {
  email: string;
  password: string;
};

export type SignUpBody = {
  userName: string;
  profilePictureUrl?: string;
  email: string;
  gender?: "M" | "F" | "T";
  dob?: string;
  passwords: string;
};

export type AuthSuccessPayload = {
  success: true;
  user: Record<string, unknown>;
};
