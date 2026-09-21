export type GetCourseListParams = {
  category?: string[];

  price?: string;

  review?: number;

  level?: string[];

  sortTitle?: 'date' | 'price';

  sortBy?: 'asc' | 'desc';

  search?: string;

  tag?: string;

  page?: number;

  limit?: number;

  signal?: AbortSignal;
};
