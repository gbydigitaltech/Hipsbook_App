import * as Yup from 'yup';
import { AddressForm } from '../../types/data/profile/profileAddress.types';

/** Validation schema for profile address form */
export const profileAddressSchema: Yup.ObjectSchema<AddressForm> = Yup.object({
  /** First name: required, max 50 chars */
  firstName: Yup.string().required('กรุณากรอกชื่อ').max(50),

  /** Last name: required, max 50 chars */
  lastName: Yup.string().required('กรุณากรอกนามสกุล').max(50),

  /** Phone: required, numeric only, minimum 10 digits */
  phone: Yup.string()
    .required('กรุณากรอกเบอร์โทรศัพท์')
    .matches(/^\d+$/, 'ต้องเป็นตัวเลขเท่านั้น')
    .min(10, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'),

  /** Address detail: required */
  address: Yup.string().required('กรุณากรอกที่อยู่'),

  /** Province selection: required (nullable input allowed before selection) */
  province: Yup.mixed<string | number>()
    .nullable()
    .required('กรุณาเลือกจังหวัด'),

  /** District selection: required (nullable input allowed before selection) */
  district: Yup.mixed<string | number>()
    .nullable()
    .required('กรุณาเลือกอำเภอ/เขต'),

  /** Subdistrict selection: required (nullable input allowed before selection) */
  subdistrict: Yup.mixed<string | number>()
    .nullable()
    .required('กรุณาเลือกตำบล/แขวง'),

  /** Zip code: normalize null/undefined to empty string and always define field */
  zip: Yup.string()
    .transform(v => (v == null ? '' : v))
    .default('')
    .defined(),
});
