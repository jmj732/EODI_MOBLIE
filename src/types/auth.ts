export type Role = "ADMIN" | "TEACHER" | "USER";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  studentCode?: number | null;
};

export type MobileTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
  user: AuthUser;
};

export type MobileAuthorizeResponse = {
  url: string;
};

export type DevLoginRequest = {
  role: Role;
};
