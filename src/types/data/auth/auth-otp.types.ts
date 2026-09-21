export interface SendOtpResponse {
  email: string;
  status: number;
  message: string;
  create: number;
  expire: number;
}

export interface VerifyOtpRequest {
  otp: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  is_activate: boolean;
  provider: string;
}
