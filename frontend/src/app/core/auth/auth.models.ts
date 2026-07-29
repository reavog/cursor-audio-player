export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface OtpVerifyRequest {
  identifier: string;
  otp: string;
  newPassword?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface MessageResponse {
  message: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}
