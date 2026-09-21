import * as Yup from 'yup';
import { apiVerifyEmailAvailable } from '../../services/auth/auth';

// Shared password rule message used across validations.
const passwordRules =
  'รหัสผ่านต้องมี 8 - 20 ตัวอักษร และประกอบด้วย a-z, A-Z และตัวเลข 0-9';

/** Validation schema for sign-up form */
export const signUpSchema = Yup.object({
  /** Email: normalize, validate format, require, and check availability via API */
  email: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .email('อีเมลไม่ถูกต้อง')
    .required('กรุณากรอกอีเมลของคุณ')
    .max(50, 'ตัวอักษรไม่ควรเกิน 50')
    .test('email-available', 'อีเมลนี้ได้ถูกใช้งานไปแล้ว', async value => {
      if (!value) return false;

      // Avoid calling API when email format is invalid.
      const isFormatValid = Yup.string().email().isValidSync(value);
      if (!isFormatValid) return false;

      const { available } = await apiVerifyEmailAvailable(value);
      return available;
    }),

  /** First name: trim, require, and limit length */
  firstName: Yup.string()
    .transform(v => v?.trim() || '')
    .required('กรุณากรอกชื่อของคุณ')
    .max(20, 'ตัวอักษรไม่ควรเกิน 20'),

  /** Last name: trim, require, and limit length */
  lastName: Yup.string()
    .transform(v => v?.trim() || '')
    .required('กรุณากรอกนามสกุลของคุณ')
    .max(20, 'ตัวอักษรไม่ควรเกิน 20'),

  /** Phone: normalize, require, numeric-only, and enforce 10 digits */
  phone: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .required('กรุณากรอกเบอร์โทรศัพท์')
    .matches(/^\d+$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น')
    .length(10, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'),

  /** Birthday: require DD/MM/YYYY and ensure it forms a real date */
  birthday: Yup.string()
    .transform(v => v?.trim() || '')
    .required('กรุณาเลือกวันที่')
    .matches(
      /^\d{2}\/\d{2}\/\d{4}$/,
      'รูปแบบวันที่ไม่ถูกต้อง (เช่น 29/10/2025)',
    )
    .test('valid-date', 'วันที่ไม่ถูกต้อง', value => {
      if (!value) return false;

      const [dd, mm, yyyy] = value.split('/');
      const d = Number(dd);
      const m = Number(mm) - 1;
      const y = Number(yyyy);

      const date = new Date(y, m, d);

      // Validate that JS date did not overflow (e.g., 32/13/2025).
      return (
        date.getFullYear() === y &&
        date.getMonth() === m &&
        date.getDate() === d
      );
    }),

  /** Password: normalize and enforce length + character requirements */
  password: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .required('กรุณากรอกรหัสผ่าน')
    .min(8, passwordRules)
    .max(20, passwordRules)
    .matches(/[a-z]/, passwordRules)
    .matches(/[A-Z]/, passwordRules)
    .matches(/[0-9]/, passwordRules),

  /** Confirm password: normalize, require, and match password */
  confirmPassword: Yup.string()
    .transform(v => v?.replace(/\s+/g, '') || '')
    .required('กรุณายืนยันรหัสผ่าน')
    .oneOf([Yup.ref('password')], 'รหัสผ่านไม่ตรงกัน'),
});

/** Inferred form value type from signUpSchema */
export type SignUpValues = Yup.InferType<typeof signUpSchema>;
