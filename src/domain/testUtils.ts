// Test-only helpers: build tournaments from the examples written in spec.md.
import { generateFixture, matchId } from './fixture';
import { formatGoalDifference } from './standings';
import type { MatchId, Result, StandingRow, Team, Tournament } from './types';

const SCORE = /^(.+?) (\d+) ?- ?(\d+) (.+)$/;

/**
 * Builds a tournament from team names (in registration order) and scores written as in the
 * spec, e.g. "Beta 1-0 Alfa". Home/away is resolved against the generated fixture.
 */
export function buildTournament(names: readonly string[], scores: readonly string[] = []): Tournament {
  const teams: Team[] = names.map((name, i) => ({ id: `t${i + 1}`, name }));
  const idOf = (name: string) => {
    const team = teams.find((t) => t.name === name);
    if (!team) throw new Error(`Unknown team "${name}"`);
    return team.id;
  };
  const matches = generateFixture(teams).flatMap((round) => round.matches);
  const results: Record<MatchId, Result> = {};

  for (const score of scores) {
    const parsed = SCORE.exec(score);
    if (!parsed) throw new Error(`Bad score "${score}"`);
    const [, first = '', firstGoals = '', secondGoals = '', second = ''] = parsed;
    const id = matchId(idOf(first), idOf(second));
    const match = matches.find((m) => m.id === id);
    if (!match) throw new Error(`No match for "${score}"`);
    const a = Number(firstGoals);
    const b = Number(secondGoals);
    results[id] = match.homeId === idOf(first) ? { homeGoals: a, awayGoals: b } : { homeGoals: b, awayGoals: a };
  }
  return { teams, nextTeamNumber: teams.length + 1, results };
}

/** Renders rows like the spec tables: "Leones 2 1 1 0 3 1 +2 4" (name PJ PG PE PP GF GC DG Pts). */
export function rowsAsText(rows: readonly StandingRow[]): string[] {
  return rows.map((r) =>
    [r.name, r.played, r.won, r.drawn, r.lost, r.goalsFor, r.goalsAgainst, formatGoalDifference(r.goalDifference), r.points].join(' '),
  );
}

/** Every worked example of spec.md, reused by several test files. */
export const specExamples = {
  rq09_1: { names: ['Leones', 'Tigres', 'Pumas'], scores: ['Tigres 2-1 Pumas', 'Pumas 0-0 Leones', 'Leones 3-1 Tigres'] },
  rq07_2: { names: ['Leones', 'Tigres', 'Pumas'], scores: ['Tigres 2-1 Pumas', 'Pumas 0-0 Leones', 'Leones 1-1 Tigres'] },
  rq08_1: { names: ['Leones', 'Tigres', 'Pumas'], scores: ['Tigres 2-1 Pumas', 'Pumas 0-0 Leones'] },
  rq10_2: { names: ['Rojos', 'Azules', 'Verdes'], scores: ['Azules 1-0 Verdes', 'Verdes 0-3 Rojos', 'Rojos 1-1 Azules'] },
  rq10_3: { names: ['Rojos', 'Azules', 'Verdes'], scores: ['Azules 1-0 Verdes', 'Verdes 2-3 Rojos', 'Rojos 0-0 Azules'] },
  rq11_1: {
    names: ['Alfa', 'Beta', 'Gama', 'Delta'],
    scores: ['Beta 1-0 Alfa', 'Alfa 2-0 Gama', 'Alfa 1-0 Delta', 'Beta 2-0 Gama', 'Delta 1-0 Beta', 'Gama 0-0 Delta'],
  },
  rq11_2: {
    names: ['Alfa', 'Beta', 'Gama', 'Delta'],
    scores: ['Gama 1-0 Beta', 'Beta 1-0 Alfa', 'Gama 0-0 Alfa', 'Delta 2-1 Gama', 'Beta 1-1 Delta', 'Alfa 2-1 Delta'],
  },
  rq11_3: { names: ['Gama', 'Alfa', 'Beta'], scores: ['Alfa 1-0 Beta', 'Beta 1-0 Gama', 'Gama 1-0 Alfa'] },
  rq11_4: { names: ['Zorros', 'Osos', 'Lobos'], scores: ['Osos 0-0 Lobos'] },
  rq11_5: { names: ['Zorros', 'Osos', 'Lobos'], scores: [] },
} as const;
