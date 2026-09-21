import * as Yup from 'yup';

/** Validation schema for sign-in form */
export const signInSchema = Yup.object().shape({
  /** Email: trim input, validate format, and require value */
  email: Yup.string()
    .transform(value => value?.trim())
    .email('อีเมลไม่ถูกต้อง')
    .required('กรุณากรอกอีเมลของคุณ'),

  /** Password: trim input, require value, and enforce minimum length */
  password: Yup.string()
    .transform(value => value?.trim())
    .required('กรุณากรอกรหัสผ่านของคุณ')
    .min(8, 'กรุณากรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร'),
});

/** Inferred form value type from signInSchema */
export type SignInValues = Yup.InferType<typeof signInSchema>;
