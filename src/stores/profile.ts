import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  apiGetProfile,
  apiUpdateProfile,
  apiUploadProfileImage,
} from '../services/profile/profile';
import type {
  ProfileResponse,
  UpdateProfilePayload,
  UploadProfileImageResponse,
} from '../types/data/profile/profile.types';

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

type ProfileState = {
  profile: ProfileResponse | null;

  isFetchingProfile: boolean;
  isUpdatingProfile: boolean;
  isUploadingProfileImage: boolean;

  fetchProfileError?: string;
  updateProfileError?: string;
  uploadProfileImageError?: string;

  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  uploadProfileImage: (file: UploadFile) => Promise<UploadProfileImageResponse>;
  clearProfile: () => void;
};

export const useProfile = create<ProfileState>()(
  devtools(set => ({
    profile: null,

    isFetchingProfile: false,
    isUpdatingProfile: false,
    isUploadingProfileImage: false,

    fetchProfileError: undefined,
    updateProfileError: undefined,
    uploadProfileImageError: undefined,

    fetchProfile: async () => {
      try {
        set({
          isFetchingProfile: true,
          fetchProfileError: undefined,
        });

        const res = await apiGetProfile();

        set({
          profile: res,
          fetchProfileError: undefined,
        });
      } catch (err) {
        set({
          fetchProfileError: (err as Error).message,
        });
      } finally {
        set({
          isFetchingProfile: false,
        });
      }
    },

    updateProfile: async payload => {
      try {
        set({
          isUpdatingProfile: true,
          updateProfileError: undefined,
        });

        const res = await apiUpdateProfile({ payload });

        set({
          profile: res,
          updateProfileError: undefined,
        });
      } catch (err) {
        set({
          updateProfileError: (err as Error).message,
        });
        throw err;
      } finally {
        set({
          isUpdatingProfile: false,
        });
      }
    },

    uploadProfileImage: async (file): Promise<UploadProfileImageResponse> => {
      try {
        set({
          isUploadingProfileImage: true,
          uploadProfileImageError: undefined,
        });

        const res = await apiUploadProfileImage({
          payload: {
            chunk: {
              uri: file.uri,
              name: file.name,
              type: file.type,
            } as any,
            index: 0,
            totalChunks: 1,
            fileId: file.name,
          },
        });

        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                profile_image: res.url,
              }
            : state.profile,
          uploadProfileImageError: undefined,
        }));

        return res;
      } catch (err) {
        set({
          uploadProfileImageError: (err as Error).message,
        });
        throw err;
      } finally {
        set({
          isUploadingProfileImage: false,
        });
      }
    },

    clearProfile: () =>
      set({
        profile: null,
        fetchProfileError: undefined,
        updateProfileError: undefined,
        uploadProfileImageError: undefined,
        isFetchingProfile: false,
        isUpdatingProfile: false,
        isUploadingProfileImage: false,
      }),
  })),
);
