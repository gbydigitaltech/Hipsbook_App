import { useEffect, useState } from 'react';
import { logError } from '../../helpers/logger';
import { apiGetBanner } from '../../services/banner/banner';
import {
  BannerApiItem,
  BannerItem,
} from '../../types/data/banner/banner.types';

/**
 * Get banners once on mount.
 */
export const useBanner = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const getBanner = async () => {
      try {
        setLoading(true);

        const res = await apiGetBanner({ signal: controller.signal });

        const parsed: BannerApiItem[] = JSON.parse(res.value ?? '[]');

        const mapped: BannerItem[] = (Array.isArray(parsed) ? parsed : [])
          .map(item => ({
            imageUrl: item?.key?.url ?? '',
            link: item?.link ?? '',
          }))
          .filter(x => x.imageUrl);

        setBanners(mapped);
      } catch (e) {
        logError('Banner', 'Banner error:', e);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    getBanner();

    return () => controller.abort();
  }, []);

  return { banners, loading };
};
