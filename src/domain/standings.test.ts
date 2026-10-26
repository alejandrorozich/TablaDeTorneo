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

describe('computeStandings — ordering and tie-breakers', () => {
  const table = (example: { names: readonly string[]; scores: readonly string[] }) =>
    rowsAsText(standingsOf(build(example)));

  it('RQ-10.1 orders by points (Leones 4, Tigres 3, Pumas 1)', () => {
    expect(table(specExamples.rq09_1)).toEqual([
      'Leones 2 1 1 0 3 1 +2 4',
      'Tigres 2 1 0 1 3 4 -1 3',
      'Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-10.2 breaks equal points by goal difference', () => {
    expect(table(specExamples.rq10_2)).toEqual([
      'Rojos 2 1 1 0 4 1 +3 4',
      'Azules 2 1 1 0 2 1 +1 4',
      'Verdes 2 0 0 2 0 4 -4 0',
    ]);
  });

  it('RQ-10.3 breaks equal points and goal difference by goals for', () => {
    expect(table(specExamples.rq10_3)).toEqual([
      'Rojos 2 1 1 0 3 2 +1 4',
      'Azules 2 1 1 0 1 0 +1 4',
      'Verdes 2 0 0 2 2 4 -2 0',
    ]);
  });

  it('RQ-11.1 two tied teams are ordered by the match between them', () => {
    expect(table(specExamples.rq11_1)).toEqual([
      'Beta 3 2 0 1 3 1 +2 6',
      'Alfa 3 2 0 1 3 1 +2 6',
      'Delta 3 1 1 1 1 1 0 4',
      'Gama 3 0 1 2 0 4 -4 1',
    ]);
  });

  it('RQ-11.2 a triple tie is resolved by points among the tied teams', () => {
    expect(table(specExamples.rq11_2)).toEqual([
      'Delta 3 1 1 1 4 4 0 4',
      'Gama 3 1 1 1 2 2 0 4',
      'Beta 3 1 1 1 2 2 0 4',
      'Alfa 3 1 1 1 2 2 0 4',
    ]);
  });

  it('RQ-11.3 a circular triple tie falls back to alphabetical order', () => {
    expect(table(specExamples.rq11_3)).toEqual([
      'Alfa 2 1 0 1 1 1 0 3',
      'Beta 2 1 0 1 1 1 0 3',
      'Gama 2 1 0 1 1 1 0 3',
    ]);
  });

  it('RQ-11.4 tied teams that drew between them are ordered alphabetically', () => {
    expect(table(specExamples.rq11_4)).toEqual([
      'Lobos 1 0 1 0 0 0 0 1',
      'Osos 1 0 1 0 0 0 0 1',
      'Zorros 0 0 0 0 0 0 0 0',
    ]);
  });

  it('RQ-11.5 tied teams with no match between them are ordered alphabetically', () => {
    expect(table(specExamples.rq11_5).map((row) => row.split(' ')[0])).toEqual(['Lobos', 'Osos', 'Zorros']);
  });

  it('RQ-11.6 the head-to-head criterion is applied once per group, without recursion', () => {
    // Six-team league. Tiburones, Pumas, Osos and Ranas tie on Pts 7, DG 0, GF 2.
    // Points among them: Tiburones 7, Ranas 4, Pumas 3, Osos 3. Pumas beat Osos, but the
    // criterion is not re-applied to that subgroup, so Osos goes first alphabetically.
    const example = {
      names: ['Tiburones', 'Pumas', 'Osos', 'Ranas', 'Halcones', 'Lobos'],
      scores: [
        'Tiburones 1-0 Pumas', 'Tiburones 1-0 Osos', 'Pumas 1-0 Osos', 'Osos 1-0 Ranas',
        'Ranas 1-0 Pumas', 'Tiburones 0-0 Ranas', 'Halcones 1-0 Tiburones', 'Lobos 1-0 Tiburones',
        'Pumas 1-0 Halcones', 'Pumas 0-0 Lobos', 'Osos 0-0 Halcones', 'Osos 1-0 Lobos',
        'Ranas 1-0 Lobos', 'Halcones 1-0 Ranas', 'Halcones 0-0 Lobos',
      ],
    };
    expect(table(example)).toEqual([
      'Halcones 5 2 2 1 2 1 +1 8',
      'Tiburones 5 2 1 2 2 2 0 7',
      'Ranas 5 2 1 2 2 2 0 7',
      'Osos 5 2 1 2 2 2 0 7',
      'Pumas 5 2 1 2 2 2 0 7',
      'Lobos 5 1 2 2 1 2 -1 5',
    ]);
  });

  it('RQ-11.7 alphabetical order follows Spanish collation (case-insensitive, ñ after n, unaccented first)', () => {
    const names = ['ñandúes', 'Nutrias', 'Atlético', 'Atletico', 'boca'];
    expect(table({ names, scores: [] }).map((row) => row.split(' ')[0])).toEqual([
      'Atletico',
      'Atlético',
      'boca',
      'Nutrias',
      'ñandúes',
    ]);
  });

  it('RQ-11.8 / RNF-01.2 order does not depend on registration order nor on result loading order', () => {
    const { names, scores } = specExamples.rq11_2;
    const reference = table({ names, scores });
    expect(table({ names: [...names].reverse(), scores })).toEqual(reference);
    expect(table({ names: ['Gama', 'Delta', 'Alfa', 'Beta'], scores: [...scores].reverse() })).toEqual(reference);
  });

  it('RQ-07.2 after editing Leones 3-1 Tigres to 1-1 the table is updated', () => {
    expect(table(specExamples.rq07_2)).toEqual([
      'Tigres 2 1 1 0 3 2 +1 4',
      'Leones 2 0 2 0 1 1 0 2',
      'Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-08.1 after deleting Leones 3-1 Tigres the table is updated', () => {
    expect(table(specExamples.rq08_1)).toEqual([
      'Tigres 1 1 0 0 2 1 +1 3',
      'Leones 1 0 1 0 0 0 0 1',
      'Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-09.2 without results every statistic is 0 and teams are in alphabetical order', () => {
    expect(table({ names: ['Leones', 'Tigres', 'Pumas'], scores: [] })).toEqual([
      'Leones 0 0 0 0 0 0 0 0',
      'Pumas 0 0 0 0 0 0 0 0',
      'Tigres 0 0 0 0 0 0 0 0',
    ]);
  });

  it('RQ-09.1 positions go from 1 to n without repeats', () => {
    const rows = standingsOf(build(specExamples.rq11_3));
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3]);
  });
});
