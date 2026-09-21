export interface ReviewPersonalInfo {
  first_name?: string;
  last_name?: string;
}

export interface ReviewUser {
  join_PersonalInfo?: ReviewPersonalInfo[];
}

export interface ReviewItem {
  id: string | number;
  user_id?: string | number;
  content?: string | null;
  rating?: number | null;

  liked_by_me?: boolean | null;
  like_count?: number | null;

  join_User?: ReviewUser;
}
