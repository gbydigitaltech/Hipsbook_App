import { OrderCheckoutResponse } from '../../types/data/orders/orders.types';
import { asError } from '../asError';
import { privateApi } from '../http';

type OrderCheckoutParams = {
  course: string[];
  lesson: string[];
  signal?: AbortSignal;
};

export const apiOrderCheckout = async ({
  course,
  lesson,
  signal,
}: OrderCheckoutParams): Promise<OrderCheckoutResponse> => {
  try {
    const { data } = await privateApi.post<OrderCheckoutResponse>(
      '/order/checkout',
      { course, lesson },
      { signal },
    );

    return data;
  } catch (err) {
    throw asError(err);
  }
};
