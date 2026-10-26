import { describe, expect, it } from 'vitest';
import { generateFixture } from './fixture';
import { computeStandings, formatGoalDifference } from './standings';
import { buildTournament, rowsAsText, specExamples } from './testUtils';
import type { Tournament } from './types';

const standingsOf = (t: Tournament) => computeStandings(t.teams, generateFixture(t.teams), t.results);
const build = (example: { names: readonly string[]; scores: readonly string[] }) =>
  buildTournament(example.names, example.scores);

describe('computeStandings — statistics', () => {
  it('RQ-09.1 computes PJ, PG, PE, PP, GF, GC, DG and Pts for Leones, Tigres, Pumas', () => {
    const rows = rowsAsText(standingsOf(build(specExamples.rq09_1)));
    expect([...rows].sort()).toEqual(
      ['Leones 2 1 1 0 3 1 +2 4', 'Tigres 2 1 0 1 3 4 -1 3', 'Pumas 2 0 1 1 1 2 -1 1'].sort(),
    );
  });

  it.each(Object.entries(specExamples))('RQ-09.3 invariants hold for spec example %s', (_, example) => {
    const rows = standingsOf(build(example));
    for (const r of rows) {
      expect(r.played).toBe(r.won + r.drawn + r.lost);
      expect(r.goalDifference).toBe(r.goalsFor - r.goalsAgainst);
      expect(r.points).toBe(3 * r.won + r.drawn);
    }
    const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
    expect(sum((r) => r.goalsFor)).toBe(sum((r) => r.goalsAgainst));
    expect(rows).toHaveLength(example.names.length);
  });

  it('RQ-09.4 a pending match does not count in any statistic', () => {
    const rows = standingsOf(buildTournament(['Leones', 'Tigres', 'Pumas'], ['Tigres 2-1 Pumas']));
    const leones = rows.find((r) => r.name === 'Leones');
    expect(rowsAsText(leones ? [leones] : [])).toEqual(['Leones 0 0 0 0 0 0 0 0']);
  });
});

describe('formatGoalDifference', () => {
  it('RQ-09.1 shows "+" for positive, "0" for zero and "-" for negative', () => {
    expect(formatGoalDifference(2)).toBe('+2');
    expect(formatGoalDifference(0)).toBe('0');
    expect(formatGoalDifference(-1)).toBe('-1');
  });
});
