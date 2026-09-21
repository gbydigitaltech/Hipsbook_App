import { create } from 'zustand';
import { logWarn, logError } from '../helpers/logger';
import { devtools } from 'zustand/middleware';

import {
  getActivateIdFromAccess,
  isActivatedV2,
  isTokenExpired,
  looksJwt,
} from '../helpers/jwtUtils';

import { clearTokens, getTokens } from '../helpers/keychain';
import { apiRefreshToken, apiSignOut } from '../services/auth/auth';
import { setOnLogout } from '../services/http';

type PendingOtpCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type AuthState = {
  isAuthenticated: boolean;
  loading: boolean;

  // Signals that bootstrap (the initial token check) is done.
  initialized: boolean;

  provider?: string;

  pendingOtpEmail: string | null;
  setPendingOtpEmail: (email: string | null) => void;

  pendingOtpCredentials: PendingOtpCredentials | null;
  setPendingOtpCredentials: (c: PendingOtpCredentials | null) => void;

  signIn: (p?: string) => Promise<void> | void;
  signOut: () => Promise<void>;
  revalidate: () => Promise<void>;
  _hardLogout: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  devtools(
    (set, get) => {
      // Bind global HTTP logout hook to local hard logout.
      setOnLogout(() => {
        (async () => {
          await get()._hardLogout();
        })();
      });

      return {
        isAuthenticated: false,
        loading: true,
        initialized: false,
        provider: undefined,

        pendingOtpEmail: null,
        setPendingOtpEmail: email => set({ pendingOtpEmail: email }),

        pendingOtpCredentials: null,
        setPendingOtpCredentials: c => set({ pendingOtpCredentials: c }),

        _hardLogout: async () => {
          await clearTokens();
          set({
            isAuthenticated: false,
            provider: undefined,
            loading: false,
            initialized: true,
            pendingOtpEmail: null,
            pendingOtpCredentials: null,
          });
        },

        signIn: async (p?: string) => {
          let provider = p;
          if (!provider) {
            provider = (await getTokens())?.provider;
          }

          set({
            isAuthenticated: true,
            provider,
            pendingOtpEmail: null,
            pendingOtpCredentials: null,
          });
        },

        signOut: async () => {
          try {
            await apiSignOut();
          } catch (e) {
            logWarn('Store', 
              'Server sign_out failed; proceeding with local logout:',
              e,
            );
          } finally {
            await clearTokens();
            set({
              isAuthenticated: false,
              provider: undefined,
              pendingOtpEmail: null,
              pendingOtpCredentials: null,
            });
          }
        },

        revalidate: async () => {
          try {
            set({ loading: true });

            const tokens = await getTokens();
            const access = tokens?.accessToken ?? '';
            const refresh = tokens?.refreshToken ?? '';
            const savedProvider = tokens?.provider;

            // No tokens at all -> log out.
            if (!access && !refresh) {
              await get()._hardLogout();
              return;
            }

            const accessNotExpired = !!access && !isTokenExpired(access);
            const activateId = access ? getActivateIdFromAccess(access) : null;

            // Access token still valid.
            if (accessNotExpired) {
              if (isActivatedV2(access)) {
                set({
                  isAuthenticated: true,
                  provider: savedProvider,
                });
                return;
              }

              // Not activated -> don't enter the app stack yet.
              if (activateId !== null && activateId !== '2') {
                set({
                  isAuthenticated: false,
                  provider: savedProvider,
                });
                return;
              }

              // fallback
              set({
                isAuthenticated: false,
                provider: savedProvider,
              });
              return;
            }

            // Access expired -> a refresh token is required.
            if (!refresh) {
              await get()._hardLogout();
              return;
            }

            // Refresh is a JWT and has expired -> log out.
            if (looksJwt(refresh) && isTokenExpired(refresh)) {
              await get()._hardLogout();
              return;
            }

            // Activation not ready -> don't allow auth yet.
            if (activateId !== null && activateId !== '2') {
              set({
                isAuthenticated: false,
                provider: savedProvider,
              });
              return;
            }

            // Request a new access token.
            const res = await apiRefreshToken(refresh);

            if (res?.access_token) {
              // If apiRefreshToken doesn't saveTokens, enable this line.
              // await saveTokens({ accessToken: res.access_token });

              if (isActivatedV2(res.access_token)) {
                const latest = await getTokens();
                set({
                  isAuthenticated: true,
                  provider: latest?.provider ?? savedProvider,
                });
                return;
              }
            }

            // Refresh failed or the new token isn't activated yet.
            const latest = await getTokens();
            set({
              isAuthenticated: false,
              provider: latest?.provider ?? savedProvider,
            });
          } catch (err) {
            logError('Store', 'revalidate/refresh failed:', err);
            await get()._hardLogout();
          } finally {
            // Always finish bootstrap.
            set({ loading: false, initialized: true });
          }
        },
      };
    },
    { name: 'auth' },
  ),
);
