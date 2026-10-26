import { describe, expect, it } from 'vitest';
import { buildTournament, specExamples } from './testUtils';
import { isLocked, validateTournament } from './tournament';

const valid = () => ({ version: 1, ...buildTournament(specExamples.rq09_1.names, specExamples.rq09_1.scores) });
type Stored = ReturnType<typeof valid>;
const withChange = (change: (data: Stored) => unknown) => change(structuredClone(valid()));

describe('isLocked', () => {
  it('RQ-06.4 / RQ-12 is false without results and true with at least one', () => {
    expect(isLocked(buildTournament(['Leones', 'Tigres', 'Pumas']))).toBe(false);
    expect(isLocked(buildTournament(['Leones', 'Tigres', 'Pumas'], ['Tigres 2-1 Pumas']))).toBe(true);
  });
});

describe('validateTournament', () => {
  it('RQ-14.2 returns a valid tournament unchanged (without the version field)', () => {
    const { version: _version, ...tournament } = valid();
    expect(validateTournament(valid())).toEqual(tournament);
  });

  it('RQ-14.2 accepts an empty tournament and one with fewer than 3 teams and no results', () => {
    expect(validateTournament({ version: 1, teams: [], nextTeamNumber: 1, results: {} })).not.toBeNull();
    expect(
      validateTournament({ version: 1, teams: [{ id: 't1', name: 'Leones' }], nextTeamNumber: 2, results: {} }),
    ).not.toBeNull();
  });

  const invalidCases: [string, unknown][] = [
    ['not an object', 'hola'],
    ['null', null],
    ['an array', []],
    ['unknown format version', withChange((d) => ({ ...d, version: 2 }))],
    ['missing version', withChange(({ version: _v, ...d }) => d)],
    ['missing teams', withChange(({ teams: _t, ...d }) => d)],
    ['missing results', withChange(({ results: _r, ...d }) => d)],
    ['results as an array', withChange((d) => ({ ...d, results: [] }))],
    ['missing nextTeamNumber', withChange(({ nextTeamNumber: _n, ...d }) => d)],
    [
      'more than 10 teams',
      {
        version: 1,
        teams: Array.from({ length: 11 }, (_, i) => ({ id: `t${i + 1}`, name: `E${i + 1}` })),
        nextTeamNumber: 12,
        results: {},
      },
    ],
    ['an empty name', withChange((d) => ({ ...d, teams: [{ id: 't1', name: '' }, ...d.teams.slice(1)] }))],
    ['a 31-character name', withChange((d) => ({ ...d, teams: [{ id: 't1', name: 'A'.repeat(31) }, ...d.teams.slice(1)] }))],
    ['a non-normalized name', withChange((d) => ({ ...d, teams: [{ id: 't1', name: ' Leones ' }, ...d.teams.slice(1)] }))],
    ['a name that is not a string', withChange((d) => ({ ...d, teams: [{ id: 't1', name: 7 }, ...d.teams.slice(1)] }))],
    ['two teams with the same comparison key', withChange((d) => ({ ...d, teams: [d.teams[0], { id: 't2', name: 'LEONES' }, d.teams[2]] }))],
    ['duplicated team ids', withChange((d) => ({ ...d, teams: [d.teams[0], { id: 't1', name: 'Tigres' }, d.teams[2]] }))],
    ['a malformed team id', withChange((d) => ({ ...d, teams: [{ id: 'x1', name: 'Leones' }, ...d.teams.slice(1)] }))],
    ['a team id not below nextTeamNumber', withChange((d) => ({ ...d, nextTeamNumber: 3 }))],
    ['goals above 99', withChange((d) => ({ ...d, results: { ...d.results, 't2:t3': { homeGoals: 120, awayGoals: 1 } } }))],
    ['negative goals', withChange((d) => ({ ...d, results: { ...d.results, 't2:t3': { homeGoals: -1, awayGoals: 1 } } }))],
    ['non-integer goals', withChange((d) => ({ ...d, results: { ...d.results, 't2:t3': { homeGoals: 1.5, awayGoals: 1 } } }))],
    ['goals as strings', withChange((d) => ({ ...d, results: { ...d.results, 't2:t3': { homeGoals: '2', awayGoals: 1 } } }))],
    ['a result for a match that does not exist', withChange((d) => ({ ...d, results: { ...d.results, 't1:t9': { homeGoals: 1, awayGoals: 0 } } }))],
    [
      'results with fewer than 3 teams',
      { version: 1, teams: [{ id: 't1', name: 'A' }, { id: 't2', name: 'B' }], nextTeamNumber: 3, results: { 't1:t2': { homeGoals: 1, awayGoals: 0 } } },
    ],
  ];

  it.each(invalidCases)('RQ-14.2 rejects data with %s', (_, data) => {
    expect(validateTournament(data)).toBeNull();
  });

  it('RQ-14.5 returns nothing partial: valid teams plus one invalid result is rejected as a whole', () => {
    const data = withChange((d) => ({ ...d, results: { ...d.results, 't1:t2': { homeGoals: 100, awayGoals: 0 } } }));
    expect(validateTournament(data)).toBeNull();
  });
});
