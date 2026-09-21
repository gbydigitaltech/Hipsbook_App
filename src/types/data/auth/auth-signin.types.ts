/** Request payload for email/password sign-in */
export interface SignInRequest {
  email: string;
  password: string;
  remember_me: boolean;
}

/** Response payload for successful sign-in */
export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  is_activate?: boolean;
  provider?: string;
}
