import { MAX_NAME_LENGTH, MAX_TEAMS } from './tournament';
import type { Team, TeamNameError, ValidationResult } from './types';

/** Trims the name and collapses every run of inner whitespace into one space. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Key used to detect duplicates: normalized and lower-cased; accents are kept. */
export function comparisonKey(name: string): string {
  return normalizeName(name).toLowerCase();
}

export function validateNewTeamName(
  teams: readonly Team[],
  raw: string,
): ValidationResult<string, TeamNameError> {
  const name = normalizeName(raw);
  if (name === '') return { ok: false, error: 'empty' };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: 'tooLong' };
  const key = comparisonKey(name);
  if (teams.some((team) => comparisonKey(team.name) === key)) return { ok: false, error: 'duplicate' };
  if (teams.length >= MAX_TEAMS) return { ok: false, error: 'maxTeams' };
  return { ok: true, value: name };
}
