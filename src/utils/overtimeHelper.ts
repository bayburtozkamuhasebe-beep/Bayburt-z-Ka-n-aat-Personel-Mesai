/**
 * Overtime Hours Helper for Bayburt Öz-Ka İnşaat
 * Enforces strictly 1 to 8 hours overtime entries.
 */

export const parseHourOvertime = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  // Extract digits
  const matched = str.match(/\d+(\.\d+)?/);
  if (!matched) return 0;

  const num = parseFloat(matched[0]);
  if (isNaN(num) || num <= 0) return 0;

  // Maximum 8 hours allowed
  return Math.min(8, Math.round(num * 2) / 2); // supports 1, 1.5, 2 ... up to 8
};

export const formatHourOvertime = (hours: number): string => {
  if (!hours || hours <= 0) return '';
  const clamped = Math.min(8, hours);
  return `${clamped}s`;
};

export const getNextCycleOvertime = (currentVal: string): string => {
  const currentHours = parseHourOvertime(currentVal);
  if (currentHours <= 0) return '1s';
  if (currentHours < 8) {
    return `${currentHours + 1}s`;
  }
  // When reaching 8, cycle back to empty
  return '';
};
