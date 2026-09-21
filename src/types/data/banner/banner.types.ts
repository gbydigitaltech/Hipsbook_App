export type BannerItem = {
  imageUrl: string;
  link: string;
};

/** Raw banner item returned from API */
export type BannerApiItem = {
  key?: {
    url?: string;
  };
  link?: string;
};
