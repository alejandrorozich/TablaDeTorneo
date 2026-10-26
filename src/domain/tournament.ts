import { generateFixture } from './fixture';
import { isValidGoals } from './goals';
import { comparisonKey, normalizeName } from './teamName';
import type { MatchId, Result, Team, Tournament } from './types';

export const MIN_TEAMS = 3;
export const MAX_TEAMS = 10;
export const MAX_NAME_LENGTH = 30;
export const STORAGE_VERSION = 1;

const TEAM_ID = /^t([1-9][0-9]*)$/;

export const emptyTournament: Tournament = { teams: [], nextTeamNumber: 1, results: {} };

/** The team list is locked as soon as one result exists (spec RQ-12). */
export function isLocked(tournament: Tournament): boolean {
  return Object.keys(tournament.results).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTeams(value: unknown, nextTeamNumber: number): Team[] | null {
  if (!Array.isArray(value) || value.length > MAX_TEAMS) return null;
  const teams: Team[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') return null;
    const idMatch = TEAM_ID.exec(item.id);
    if (!idMatch || Number(idMatch[1]) >= nextTeamNumber) return null;
    const { name } = item;
    if (name === '' || name.length > MAX_NAME_LENGTH || normalizeName(name) !== name) return null;
    teams.push({ id: item.id, name });
  }
  const ids = new Set(teams.map((t) => t.id));
  const keys = new Set(teams.map((t) => comparisonKey(t.name)));
  return ids.size === teams.length && keys.size === teams.length ? teams : null;
}

function parseResults(value: unknown, teams: readonly Team[]): Record<MatchId, Result> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > 0 && teams.length < MIN_TEAMS) return null;
  const matchIds = new Set(generateFixture(teams).flatMap((round) => round.matches.map((m) => m.id)));
  const results: Record<MatchId, Result> = {};
  for (const [id, result] of entries) {
    if (!matchIds.has(id) || !isRecord(result)) return null;
    if (!isValidGoals(result.homeGoals) || !isValidGoals(result.awayGoals)) return null;
    results[id] = { homeGoals: result.homeGoals, awayGoals: result.awayGoals };
  }
  return results;
}

/**
 * Validates stored data (spec RQ-14.2). All or nothing: any invalid part rejects the whole
 * tournament (RQ-14.5).
 */
export function validateTournament(data: unknown): Tournament | null {
  if (!isRecord(data) || data.version !== STORAGE_VERSION) return null;
  const { nextTeamNumber } = data;
  if (!Number.isInteger(nextTeamNumber) || (nextTeamNumber as number) < 1) return null;
  const teams = parseTeams(data.teams, nextTeamNumber as number);
  if (!teams) return null;
  const results = parseResults(data.results, teams);
  if (!results) return null;
  return { teams, nextTeamNumber: nextTeamNumber as number, results };
}
