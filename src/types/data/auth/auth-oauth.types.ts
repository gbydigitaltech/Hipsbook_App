// ---------- Google ----------

export interface GoogleSignInRequest {
  id: string;
  email: string;
  name?: string;
}

export interface GoogleSignInResponse {
  access_token: string;
  refresh_token?: string;
  provider?: string;
}

// ---------- Twitter ----------

export interface TwitterSignInRequest {
  id: string;
  name?: string;
}

export interface TwitterSignInResponse {
  access_token: string;
  refresh_token?: string;
  provider?: string;
}

// ---------- LINE ----------

export interface LineSignInRequest {
  sub: string;
  name?: string;
}

export interface LineSignInResponse {
  access_token: string;
  refresh_token?: string;
  provider?: string;
}

// ---------- Apple ----------

export interface AppleSignInRequest {
  id: string;
  name?: string;
}

export interface AppleSignInResponse {
  access_token: string;
  refresh_token?: string;
  provider?: string;
}
