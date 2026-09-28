export const toCents = (amount) => Math.round(amount * 100);
export const fromCents = (cents) => cents / 100;
export const toAmount = fromCents;

/** Local calendar YYYY-MM (avoids UTC day-boundary shift from toISOString). */
export const toYearMonthLocal = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Inclusive local-time bounds for a YYYY-MM month string. */
export const getLocalMonthBounds = (monthStr) => {
  const [y, m] = String(monthStr).split('-').map(Number);
  const startOfMonth = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
  return { startOfMonth, endOfMonth };
};
