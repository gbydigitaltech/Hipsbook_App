import { RESET_PASSWORD_CALLBACK } from '@env';
import { getTokens, saveTokens } from '../../helpers/keychain';
import {
  SendOtpResponse,
  VerifyOtpResponse,
} from '../../types/data/auth/auth-otp.types';
import {
  SignInRequest,
  SignInResponse,
} from '../../types/data/auth/auth-signin.types';
import {
  CheckEmailResponse,
  SignUpRequest,
  SignUpResponse,
} from '../../types/data/auth/auth-signup.types';
import { RefreshTokenResponse } from '../../types/data/auth/auth.types';
import { asError } from '../asError';
export type { ApiError as AuthApiError } from '../asError';
import { privateApi, publicApi, request } from '../http';

type TokenPayload = {
  access_token?: string;
  refresh_token?: string;
  provider?: string;
};

const persistTokens = async ({
  access_token,
  refresh_token,
  provider,
}: TokenPayload): Promise<void> => {
  if (!access_token) return;

  await saveTokens({
    accessToken: access_token,
    refreshToken: refresh_token,
    provider,
  });
};

export const apiSignIn = async (
  payload: SignInRequest,
): Promise<SignInResponse> => {
  const data = await request(
    publicApi.post<SignInResponse>('/auth/sign_in', payload),
  );

  await persistTokens(data);

  return data;
};

export const apiSignUp = async (
  payload: SignUpRequest,
): Promise<SignUpResponse> => {
  const data = await request(
    publicApi.post<SignUpResponse>('/auth/sign_up', payload),
  );

  await persistTokens(data);

  return data;
};

export const apiVerifyEmailAvailable = async (
  email: string,
): Promise<CheckEmailResponse> => {
  try {
    const data = await request<{ message?: string }>(
      publicApi.post('/auth/check_email', { email }),
    );

    return {
      available: true,
      message: data?.message,
    };
  } catch (err) {
    const error = asError(err);

    if (error.status === 409) {
      return {
        available: false,
        message: error.serverMessage || error.message,
      };
    }

    throw error;
  }
};

export const apiSendOtp = async (): Promise<SendOtpResponse> => {
  try {
    return await request(privateApi.post<SendOtpResponse>('/auth/send_otp'));
  } catch (err) {
    const error = asError(err);
    const data = error.responseData as Partial<SendOtpResponse> | undefined;

    if (data?.create && data?.expire) {

      return {
        create: data.create,
        expire: data.expire,
      } as SendOtpResponse;
    }

    throw error;
  }
};

export const apiVerifyOtp = async (otp: string): Promise<VerifyOtpResponse> => {
  return request(
    privateApi.post<VerifyOtpResponse>('/auth/verify_otp', { otp }),
  );
};

export const apiForgotPassword = async (email: string): Promise<void> => {
  await request(
    publicApi.post('/auth/forgot_password', {
      email,
      callback: RESET_PASSWORD_CALLBACK,
    }),
  );
};

export const apiRefreshToken = async (
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  try {
    const { accessToken } = (await getTokens()) ?? {};

    const data = await request(
      publicApi.post<RefreshTokenResponse>(
        '/auth/token',
        { refresh_token: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken ?? ''}`,
          },
        },
      ),
    );

    if (!data?.access_token) {
      throw new Error('Invalid response: missing access_token');
    }

    await persistTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
    });

    return data;
  } catch (err) {
    throw asError(err);
  }
};

export const apiSignOut = async (): Promise<void> => {
  try {
    await request(privateApi.post('/auth/sign_out', {}));
  } catch (err) {
    const error = asError(err);

    if (error.status === 401 || error.status === 403) {
      return;
    }

    throw error;
  }
};
