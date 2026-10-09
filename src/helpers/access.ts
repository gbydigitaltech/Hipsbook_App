/**
 * One set of rules for "is this free / can the user open it", used by course
 * cards, lesson/document cards, the course detail screen and the classroom.
 *
 * Course and lesson are checked separately: a paid course can still have
 * free lessons (lesson.is_free / lesson.price === 0).
 */

/** API flags may come as true / 1 / '1' / 'true' */
export const isTruthyFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';

/**
 * Real numeric price, or null when the API sent nothing usable
 * (null / undefined / '' / not a number). A missing price is NOT free.
 */
export const parsePrice = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Free = flagged free, or an actual price of 0 */
export const isFreeItem = (price: unknown, isFree: unknown): boolean =>
  isTruthyFlag(isFree) || parsePrice(price) === 0;

type AccessFields = {
  price?: unknown;
  is_free?: unknown;
  activate?: unknown;
};

/** User can open it: free, or already bought (activate) */
export const canAccessItem = ({ price, is_free, activate }: AccessFields) =>
  isFreeItem(price, is_free) || isTruthyFlag(activate);

/** Free but not bought yet: needs a (free) checkout before it can play */
export const needsFreeCheckout = (item: AccessFields) =>
  !isTruthyFlag(item.activate) && isFreeItem(item.price, item.is_free);

const formatNumberTH = (n: number) => {
  try {
    return new Intl.NumberFormat('th-TH').format(n);
  } catch {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

/** "ซื้อ ฿990" — or just "ซื้อ" when the price is unknown */
export const buyLabel = (price: unknown): string => {
  const p = parsePrice(price);
  return p != null && p > 0 ? `ซื้อ ฿${formatNumberTH(p)}` : 'ซื้อ';
};
