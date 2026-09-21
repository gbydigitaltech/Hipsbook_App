/** Single address entity from API */
export interface AddressItem {
  /** Address ID */
  id: string;

  /** Recipient first name */
  first_name: string;

  /** Recipient last name */
  last_name: string;

  /** Recipient phone number */
  phone_number: string;

  /** Street/address detail */
  address: string;

  /** Optional joined subdistrict metadata */
  join_Subdistrict?: {
    /** Subdistrict ID */
    id: string | number;

    /** Subdistrict name (Thai) */
    name_th: string;

    /** Subdistrict name (English) */
    name_en: string;

    /** Postal code */
    zip_code: string;
  };

  /** Optional joined district metadata */
  join_District?: {
    /** District ID */
    id: string | number;

    /** District name (Thai) */
    name_th: string;

    /** District name (English) */
    name_en: string;
  };

  /** Optional joined province metadata */
  join_Province?: {
    /** Province ID */
    id: string | number;

    /** Province name (Thai) */
    name_th: string;

    /** Province name (English) */
    name_en: string;
  };

  /** Optional joined address status metadata */
  join_MasterAddressStatus?: {
    /** Status ID */
    id: string | number;

    /** Status label */
    label: string;
  };

  /** Foreign key: subdistrict ID */
  fk_subdistrict_id?: string | number;

  /** Foreign key: district ID */
  fk_district_id?: string | number;

  /** Foreign key: province ID */
  fk_province_id?: string | number;

  /** Postal code */
  zip_code?: string;
}

/** API response: list of addresses */
export type AddressListResponse = AddressItem[];

/** UI form model for address input */
export type AddressForm = {
  /** First name (camelCase for form binding) */
  firstName: string;

  /** Last name (camelCase for form binding) */
  lastName: string;

  /** Phone number (camelCase for form binding) */
  phone: string;

  /** Street/address detail */
  address: string;

  /** Selected province ID */
  province: string | number | null;

  /** Selected district ID */
  district: string | number | null;

  /** Selected subdistrict ID */
  subdistrict: string | number | null;

  /** Postal code */
  zip: string;
};

/** Payload for creating a new address */
export type CreateAddressPayload = {
  /** First name */
  first_name: string;

  /** Last name */
  last_name: string;

  /** Phone number */
  phone_number: string;

  /** Street/address detail */
  address: string;

  /** Province ID */
  province_id: string;

  /** District ID */
  district_id: string;

  /** Subdistrict ID */
  subdistrict_id: string;
};

/** Payload for updating an address (partial fields allowed) */
export type UpdateAddressPayload = Partial<CreateAddressPayload>;
