import { saveTokens } from '../../helpers/keychain';
import {
  AppleSignInRequest,
  AppleSignInResponse,
} from '../../types/data/auth/auth-oauth.types';
import { asError } from '../asError';
import { publicApi } from '../http';

const persistTokens = async (data: AppleSignInResponse): Promise<void> => {
  if (!data?.access_token) return;

  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    provider: data.provider ?? 'apple',
  });
};

export const apiSignInWithApple = async (
  payload: AppleSignInRequest,
): Promise<AppleSignInResponse> => {
  try {
    const { data } = await publicApi.post<AppleSignInResponse>(
      '/auth/apple',
      payload,
    );

    await persistTokens(data);

    return data;
  } catch (err) {
    throw asError(err);
  }
};
