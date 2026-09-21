import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiOrderCheckout } from '../../services/orders/orders';
import { OrderCheckoutResponse } from '../../types/data/orders/orders.types';

interface CheckoutParams {
  course: string[];
  lesson: string[];
}

/**
 * Handle order checkout request and its loading/error/data states.
 */
export const useOrderCheckout = () => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<OrderCheckoutResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit checkout payload to API.
   * Returns API response and rethrows on error for caller handling.
   */
  const checkout = useCallback(async ({ course, lesson }: CheckoutParams) => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiOrderCheckout({ course, lesson });
      setData(res);

      // Checkout succeeded: invalidate the cached course lists that show
      // ownership state (Home = recommendCourses, list page = courseList)
      // so they reflect the newly owned course.
      queryClient.invalidateQueries({ queryKey: ['recommendCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courseList'] });

      return res;
    } catch (err: any) {
      setError(err?.message ?? 'เกิดข้อผิดพลาด');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  return { checkout, data, loading, error };
};
