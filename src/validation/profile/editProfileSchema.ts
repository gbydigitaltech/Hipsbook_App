import * as Yup from 'yup';
import { ProfileForm } from '../../types/data/profile/profile.types';

/** Validation schema for edit-profile form */
export const editProfileSchema: Yup.ObjectSchema<ProfileForm> = Yup.object({
  firstName: Yup.string()
    .transform(value => value?.trim())
    .required('กรุณากรอกชื่อของคุณ')
    .max(20, 'ตัวอักษรไม่ควรเกิน 20'),

  lastName: Yup.string()
    .transform(value => value?.trim())
    .required('กรุณากรอกนามสกุลของคุณ')
    .max(20, 'ตัวอักษรไม่ควรเกิน 20'),

  email: Yup.string()
    .transform(value => value?.trim())
    .email('อีเมลไม่ถูกต้อง')
    .required('กรุณากรอกอีเมลของคุณ')
    .max(50, 'ตัวอักษรไม่ควรเกิน 50'),

  phone: Yup.string()
    .transform(value => value?.trim())
    .matches(/^\d{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข')
    .required('กรุณากรอกเบอร์โทรศัพท์'),

  birthday: Yup.string()
    .transform(value => value?.trim())
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

      const same =
        date.getFullYear() === y &&
        date.getMonth() === m &&
        date.getDate() === d;

      const notFuture = date.getTime() <= new Date().setHours(23, 59, 59, 999);

      return same && notFuture;
    }),

  profile_image: Yup.mixed<string | File>().nullable().optional(),
}).required();
