/** Payload for password update request */
export interface UpdatePasswordPayload {
  /** Current password for verification */
  old_password: string;

  /** New password to replace current password */
  new_password: string;
}
