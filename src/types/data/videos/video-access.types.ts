export interface VideoAccessRequest {
  /** Video media id (e.g. "hZVoBapE"). */
  videoId: string;
  /** Lesson id (UUID). */
  lessonId: string;
}

export interface VideoAccessResponse {
  /** Video stream URL (with a signed token + expiry appended). */
  streamUrl: string;
  lessonId: string;
  courseId: string;
  /** Video provider, e.g. "jwplayer" (may change in the future). */
  provider: string;
}
