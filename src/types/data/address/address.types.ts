/** Province entity */
export interface Province {
  /** Unique province identifier */
  id: string | number;

  /** Province name in Thai */
  name_th: string;

  /** Province name in English */
  name_en: string;
}

/** District entity */
export interface District {
  /** Unique district identifier */
  id: string | number;

  /** District name in Thai */
  name_th: string;

  /** District name in English */
  name_en: string;

  /** Parent province identifier */
  province_id: string | number;
}

/** Subdistrict entity */
export interface Subdistrict {
  /** Unique subdistrict identifier */
  id: string | number;

  /** Subdistrict name in Thai */
  name_th: string;

  /** Subdistrict name in English */
  name_en: string;

  /** Parent district identifier */
  district_id: string | number;

  /** Postal code */
  zipcode: string;
}

/** API response: province list */
export type ProvinceListResponse = Province[];

/** API response: district list */
export type DistrictListResponse = District[];

/** API response: subdistrict list */
export type SubdistrictListResponse = Subdistrict[];
