import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type OtpState = {
  // OTP creation timestamp (ms). Null when no active OTP metadata.
  createTime: number | null;

  // OTP expiration timestamp (ms). Null when no active OTP metadata.
  expireTime: number | null;

  // True while requesting OTP from server.
  isRequesting: boolean;

  // Set OTP timing metadata.
  setMeta: (create: number, expire: number) => void;

  // Clear OTP timing metadata.
  clearMeta: () => void;

  // Update requesting/loading flag for OTP actions.
  setIsRequesting: (val: boolean) => void;
};

export const useOtpStore = create<OtpState>()(
  devtools(
    set => ({
      createTime: null,
      expireTime: null,
      isRequesting: false,

      // Save create/expire timestamps returned by OTP API.
      setMeta: (create, expire) =>
        set({
          createTime: create,
          expireTime: expire,
        }),

      // Reset OTP timestamps (e.g., on success/logout/flow restart).
      clearMeta: () =>
        set({
          createTime: null,
          expireTime: null,
        }),

      // Toggle OTP request in-flight state.
      setIsRequesting: val => set({ isRequesting: val }),
    }),
    { name: 'otp-store' },
  ),
);
