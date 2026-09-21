/** Teacher entity returned by API */
export type Teacher = {
  /** Teacher ID */
  id: string;

  /** Profile image URL */
  profile_image: string | null;

  /** First name */
  first_name: string;

  /** Last name */
  last_name: string;

  /** Gender value (backend-defined) */
  gender: string | null;

  /** Date of birth */
  date_of_birth: string | null;

  /** Email address */
  email: string | null;

  /** Phone number */
  phone_number: string | null;

  /** LINE ID */
  line_id: string | null;

  /** Education background */
  education: string | null;

  /** Work/teaching experience */
  experience: string | null;

  /** Main skill list */
  skill: string[];

  /** Additional skill list */
  skill_other: string[];

  /** Number of courses */
  course_amount: number;

  /** Number of reviews */
  review_amount: number;

  /** Rating aggregate/value from backend */
  ratings_amount: number;

  /** Optional alternative total: courses */
  course_total?: number;

  /** Optional alternative total: reviews */
  review_total?: number;

  /** Optional alternative total: ratings */
  ratings_total?: number;
};

/** Paginated response for recommended teachers */
export type TeacherRecommendResponse = {
  /** Teacher items for current page */
  data: Teacher[];

  /** Total teacher items */
  total: number;

  /** Page size */
  limit: number;

  /** Total number of pages */
  total_pages: number;

  /** Current page (optional by backend) */
  page?: number;
};
