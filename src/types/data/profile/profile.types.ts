/** API response payload for user profile data */
export type ProfileResponse = {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  email: string;
  profile_image?: string | File | null;
};

/** Payload for updating user profile (all fields optional/partial) */
export type UpdateProfilePayload = Partial<{
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string | number;
  email: string;
  profile_image?: string | File | null;
}>;

/** UI form model for profile edit screen */
export type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  profile_image?: string | File | null;
};

export type UploadProfileImagePayload = {
  chunk: {
    uri: string;
    name: string;
    type: string;
  };
  index: number;
  totalChunks: number;
  fileId: string;
};

export type UploadProfileImageResponse = {
  key: string;
  url: string;
  contentType: string;
  bucket: string;
  originalName: string;
  fileId: string;
};
