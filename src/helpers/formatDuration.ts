/**
 * Convert duration in milliseconds to Thai text.
 * Example: formats 2h 15m into a human-readable duration string.
 */
export const formatDurationThai = (ms: number): string => {
  // Guard invalid/empty values
  if (!ms || ms <= 0) return '0 นาที';

  // Convert to minutes (round up so partial minute is shown as 1 minute)
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.ceil(totalSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // hours and minutes
  if (hours > 0 && minutes > 0) {
    return `${hours} ชั่วโมง ${minutes} นาที`;
  }

  // exact hour
  if (hours > 0 && minutes === 0) {
    return `${hours} ชั่วโมง`;
  }

  // Less than 1 hour
  return `${minutes} นาที`;
};
