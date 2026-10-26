const MAX_GOALS = 99;
const DIGITS_ONLY = /^[0-9]+$/;

/** Parses a goals value: digits only (surrounding spaces allowed), integer from 0 to 99. */
export function parseGoals(raw: string): number | null {
  const value = raw.trim();
  if (!DIGITS_ONLY.test(value)) return null;
  const goals = Number(value);
  return goals <= MAX_GOALS ? goals : null;
}
