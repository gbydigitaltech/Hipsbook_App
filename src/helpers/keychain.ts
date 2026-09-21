import * as Keychain from 'react-native-keychain';

/** Supported auth provider values */
export type AuthProvider =
  | 'hipsbook'
  | 'google'
  | 'twitter'
  | 'apple'
  | 'hipsbook/google'
  | string;

/** Token payload stored in Keychain */
export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  provider?: AuthProvider;
};

/**
 * Save access/refresh tokens to Keychain.
 * Merges with previous values to avoid accidental data loss.
 */
export const saveTokens = async ({
  accessToken,
  refreshToken = '',
  provider,
}: StoredTokens) => {
  const prev = await getTokens(); // merge with previous stored values

  const merged: StoredTokens = {
    accessToken: accessToken || prev?.accessToken || '',
    refreshToken: refreshToken || prev?.refreshToken,
    provider: provider ?? prev?.provider,
  };

  await Keychain.setGenericPassword('authTokens', JSON.stringify(merged));
};

/**
 * Read stored tokens from Keychain.
 * Returns null when not found or invalid JSON.
 */
export const getTokens = async (): Promise<StoredTokens | null> => {
  const credentials = await Keychain.getGenericPassword();
  if (!credentials) return null;

  try {
    return JSON.parse(credentials.password) as StoredTokens;
  } catch {
    return null;
  }
};

/** Remove all stored auth tokens from Keychain */
export const clearTokens = async () => {
  await Keychain.resetGenericPassword();
};
