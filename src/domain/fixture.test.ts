import { describe, expect, it } from 'vitest';
import { generateFixture, matchId } from './fixture';
import type { Round, Team } from './types';

const teams = (...names: string[]): Team[] => names.map((name, i) => ({ id: `t${i + 1}`, name }));
const range = (n: number) => Array.from({ length: n }, (_, i) => `E${i + 1}`);

/** Renders a fixture with team names, in the same shape as the spec tables. */
function describeFixture(list: readonly Team[], rounds: readonly Round[]) {
  const name = (id: string | null) => list.find((t) => t.id === id)?.name ?? null;
  return rounds.map((round) => ({
    round: round.number,
    matches: round.matches.map((m) => `${name(m.homeId)} vs ${name(m.awayId)}`),
    bye: name(round.byeTeamId),
  }));
}

function pairCounts(rounds: readonly Round[]) {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const m of round.matches) {
      const key = [m.homeId, m.awayId].sort().join('|');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

describe('generateFixture', () => {
  it('RQ-04.1 produces the exact fixture for A, B, C, D', () => {
    const list = teams('A', 'B', 'C', 'D');
    expect(describeFixture(list, generateFixture(list))).toEqual([
      { round: 1, matches: ['A vs D', 'B vs C'], bye: null },
      { round: 2, matches: ['C vs A', 'D vs B'], bye: null },
      { round: 3, matches: ['A vs B', 'C vs D'], bye: null },
    ]);
  });

  it.each([4, 6, 8, 10])('RQ-04.2 with %i teams has n-1 rounds of n/2 matches and no bye', (n) => {
    const rounds = generateFixture(teams(...range(n)));
    expect(rounds).toHaveLength(n - 1);
    for (const round of rounds) {
      expect(round.matches).toHaveLength(n / 2);
      expect(round.byeTeamId).toBeNull();
    }
    expect(rounds.flatMap((r) => r.matches)).toHaveLength((n * (n - 1)) / 2);
  });

  it.each([3, 4, 5, 6, 7, 8, 9, 10])(
    'RQ-04.3 with %i teams every pair meets exactly once and nobody plays twice per round',
    (n) => {
      const list = teams(...range(n));
      const rounds = generateFixture(list);
      const counts = pairCounts(rounds);
      expect(counts.size).toBe((n * (n - 1)) / 2);
      expect([...counts.values()].every((c) => c === 1)).toBe(true);
      for (const round of rounds) {
        const ids = round.matches.flatMap((m) => [m.homeId, m.awayId]);
        expect(new Set(ids).size).toBe(ids.length);
        expect(round.matches.every((m) => m.homeId !== m.awayId)).toBe(true);
      }
    },
  );

  it('RQ-04.4 / RNF-01.1 is deterministic: same teams in same order give identical fixtures', () => {
    const first = generateFixture(teams(...range(7)));
    const second = generateFixture(teams(...range(7)));
    expect(second).toEqual(first);
  });

  it('RQ-04.5 uses registration order (D, C, B, A -> round 1 "D vs A", "C vs B")', () => {
    const list = teams('D', 'C', 'B', 'A');
    expect(describeFixture(list, generateFixture(list))[0]).toEqual({
      round: 1,
      matches: ['D vs A', 'C vs B'],
      bye: null,
    });
  });

  it('RQ-05.1 produces the exact fixture with byes for A, B, C', () => {
    const list = teams('A', 'B', 'C');
    expect(describeFixture(list, generateFixture(list))).toEqual([
      { round: 1, matches: ['B vs C'], bye: 'A' },
      { round: 2, matches: ['C vs A'], bye: 'B' },
      { round: 3, matches: ['A vs B'], bye: 'C' },
    ]);
  });

  it('RQ-05.2 produces the exact fixture with byes for A, B, C, D, E', () => {
    const list = teams('A', 'B', 'C', 'D', 'E');
    expect(describeFixture(list, generateFixture(list))).toEqual([
      { round: 1, matches: ['B vs E', 'C vs D'], bye: 'A' },
      { round: 2, matches: ['E vs A', 'B vs C'], bye: 'D' },
      { round: 3, matches: ['A vs D', 'E vs C'], bye: 'B' },
      { round: 4, matches: ['C vs A', 'D vs B'], bye: 'E' },
      { round: 5, matches: ['A vs B', 'D vs E'], bye: 'C' },
    ]);
  });

  it.each([3, 5, 7, 9])('RQ-05.3 with %i teams has n rounds, (n-1)/2 matches and each team rests once', (n) => {
    const list = teams(...range(n));
    const rounds = generateFixture(list);
    expect(rounds).toHaveLength(n);
    for (const round of rounds) expect(round.matches).toHaveLength((n - 1) / 2);
    const byes = rounds.map((r) => r.byeTeamId);
    expect(byes.every((b) => b !== null)).toBe(true);
    expect([...new Set(byes)].sort()).toEqual(list.map((t) => t.id).sort());
  });

  it.each([0, 1, 2])('RQ-02.2 returns no rounds with %i teams', (n) => {
    expect(generateFixture(teams(...range(n)))).toEqual([]);
  });

  it('RQ-04.4 match ids are the sorted pair of team ids and do not depend on home/away', () => {
    const rounds = generateFixture(teams('A', 'B', 'C', 'D'));
    const all = rounds.flatMap((r) => r.matches);
    for (const m of all) expect(m.id).toBe(matchId(m.homeId, m.awayId));
    expect(all.find((m) => m.homeId === 't3' && m.awayId === 't1')?.id).toBe('t1:t3');
  });
});

describe('matchId', () => {
  it('RQ-04.4 is symmetric and orders ids numerically', () => {
    expect(matchId('t1', 't3')).toBe('t1:t3');
    expect(matchId('t3', 't1')).toBe('t1:t3');
    expect(matchId('t10', 't2')).toBe('t2:t10');
  });
});
