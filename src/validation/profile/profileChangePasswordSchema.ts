import * as Yup from 'yup';

/** Shared password rule message */
export const passwordRules =
  'รหัสผ่านต้องมี 8 - 20 ตัวอักษร และประกอบด้วย a-z, A-Z และตัวเลข 0-9';

/** Validation schema for change-password form */
export const changePasswordSchema = Yup.object({
  /** Current password: normalize and require */
  currentPassword: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .required('กรุณากรอกรหัสผ่านเดิม'),

  /** New password: normalize, require, and enforce strength policy */
  newPassword: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .required('กรุณากรอกรหัสผ่าน')
    .min(8, passwordRules)
    .max(20, passwordRules)
    .matches(/[a-z]/, passwordRules)
    .matches(/[A-Z]/, passwordRules)
    .matches(/[0-9]/, passwordRules),

  /** Confirm password: normalize, require, and match newPassword */
  confirmNewPassword: Yup.string()
    .transform(v => v?.replace(/\s+/g, ''))
    .required('กรุณายืนยันรหัสผ่าน')
    .oneOf([Yup.ref('newPassword')], 'รหัสผ่านไม่ตรงกัน'),
});

/** Inferred form value type from changePasswordSchema */
export type ChangePasswordSchema = Yup.InferType<typeof changePasswordSchema>;
