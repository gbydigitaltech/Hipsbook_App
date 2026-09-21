/**
 * Parse "DD/MM/YYYY" text into a valid Date.
 * Returns undefined for empty/invalid/impossible dates.
 */
export const parseDDMMYYYY = (text?: string): Date | undefined => {
  if (!text) return undefined;

  // Keep only digits and "/" to tolerate accidental extra characters
  const clean = text.replace(/[^\d/]/g, '').trim();
  const [dd, mm, yyyy] = clean.split('/');

  const d = Number(dd);
  const m = Number(mm) - 1; // JS month index: 0-11
  const y = Number(yyyy);

  // Basic range guards
  if (!d || !y || m < 0 || m > 11) return undefined;

  const dt = new Date(y, m, d);

  // Reject invalid or overflow dates (e.g. 31/02/2025)
  return Number.isNaN(dt.getTime())
    ? undefined
    : dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
    ? dt
    : undefined;
};

/**
 * Format Date to "DD/MM/YYYY".
 * Returns empty string for invalid/missing date.
 */
export const formatDateDDMMYYYY = (d?: Date): string => {
  if (!d || Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Convert Date to UTC epoch milliseconds at 00:00:00.000 (start of day UTC).
 */
export const dateToEpochMillisecondsUTC = (dt: Date): string => {
  const msUTC = Date.UTC(
    dt.getFullYear(),
    dt.getMonth(),
    dt.getDate(),
    0,
    0,
    0,
    0,
  );

  return String(msUTC);
};

/**
 * Convert "DD/MM/YYYY" directly to UTC epoch milliseconds.
 * Returns undefined if input date is invalid.
 */
export const ddmmyyyyToEpochUTC = (text?: string): string | undefined => {
  const dt = parseDDMMYYYY(text);
  return dt ? dateToEpochMillisecondsUTC(dt) : undefined;
};
