import * as Yup from 'yup';

/** Validation schema for forgot-password form */
export const forgotPasswordSchema = Yup.object().shape({
  /** User email must be valid and required */
  email: Yup.string().email('อีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมลของคุณ'),
});

/** Inferred form value type from forgotPasswordSchema */
export type ForgotPasswordValues = Yup.InferType<typeof forgotPasswordSchema>;
