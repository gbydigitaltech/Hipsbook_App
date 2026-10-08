/**
 * Short clip length for a badge: "00:12:40.0" -> "12:40", "01:41:37.0" -> "1:41:37".
 * Falls back to `ms` (milliseconds) when the string is missing.
 */
export const formatClipDuration = (str?: string | null, ms?: number | null) => {
  let total = NaN;
  if (str && str.trim()) {
    const parts = str.trim().split('.')[0].split(':').map(Number);
    if (parts.every(n => Number.isFinite(n))) {
      total = parts.reduce((acc, n) => acc * 60 + n, 0);
    }
  }
  if (!Number.isFinite(total) && typeof ms === 'number' && ms > 0) {
    total = Math.round(ms / 1000);
  }
  if (!Number.isFinite(total) || total <= 0) return '';

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
