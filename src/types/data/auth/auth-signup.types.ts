/** Request payload for user registration */
export interface SignUpRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  password: string;
}

/** Response payload for successful sign-up */
export interface SignUpResponse {
  access_token: string;
  is_activate: boolean;
  provider: string;
}

/** Response for checking email availability */
export interface CheckEmailResponse {
  available: boolean;
  message?: string;
}
