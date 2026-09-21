import { saveTokens } from '../../helpers/keychain';
import {
  LineSignInRequest,
  LineSignInResponse,
} from '../../types/data/auth/auth-oauth.types';
import { publicApi, request } from '../http';

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
    provider: provider ?? 'line',
  });
};

export const apiSignInWithLine = async (
  payload: LineSignInRequest,
): Promise<LineSignInResponse> => {
  const data = await request(
    publicApi.post<LineSignInResponse>('/auth/line', payload),
  );

  await persistTokens(data);

  return data;
};
