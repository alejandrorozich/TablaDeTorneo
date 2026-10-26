import { describe, expect, it } from 'vitest';
import { comparisonKey, normalizeName, validateNewTeamName } from './teamName';
import type { Team } from './types';

const teams = (...names: string[]): Team[] => names.map((name, i) => ({ id: `t${i + 1}`, name }));

describe('normalizeName', () => {
  it('RQ-01.2 trims and collapses inner spaces ("  River   Plate  " -> "River Plate")', () => {
    expect(normalizeName('  River   Plate  ')).toBe('River Plate');
  });
});

describe('comparisonKey', () => {
  it('RQ-01.3 ignores case and extra spaces but keeps accents', () => {
    expect(comparisonKey(' River  PLATE ')).toBe('river plate');
    expect(comparisonKey('Atlético')).not.toBe(comparisonKey('Atletico'));
  });
});

describe('validateNewTeamName', () => {
  it('RQ-01.2 returns the normalized name when valid', () => {
    expect(validateNewTeamName([], '  River   Plate  ')).toEqual({ ok: true, value: 'River Plate' });
  });

  it.each(['river plate', 'RIVER PLATE', ' River  Plate '])(
    'RQ-01.3 rejects "%s" as duplicate of "River Plate"',
    (raw) => {
      expect(validateNewTeamName(teams('River Plate'), raw)).toEqual({ ok: false, error: 'duplicate' });
    },
  );

  it('RQ-01.4 accepts "Atletico" when "Atlético" exists (accents distinguish names)', () => {
    expect(validateNewTeamName(teams('Atlético'), 'Atletico')).toEqual({ ok: true, value: 'Atletico' });
  });

  it.each(['', '    '])('RQ-01.5 rejects empty name "%s"', (raw) => {
    expect(validateNewTeamName([], raw)).toEqual({ ok: false, error: 'empty' });
  });

  it('RQ-01.6 accepts 30 characters and rejects 31, measured after normalizing', () => {
    const thirty = 'A'.repeat(30);
    expect(validateNewTeamName([], `  ${thirty}  `)).toEqual({ ok: true, value: thirty });
    expect(validateNewTeamName([], 'A'.repeat(31))).toEqual({ ok: false, error: 'tooLong' });
    expect(validateNewTeamName([], 'A'.repeat(15) + '     ' + 'B'.repeat(14))).toEqual({
      ok: true,
      value: 'A'.repeat(15) + ' ' + 'B'.repeat(14),
    });
  });

  it('RQ-02.1 rejects an eleventh team with a valid name', () => {
    const ten = teams('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10');
    expect(validateNewTeamName(ten, 'E11')).toEqual({ ok: false, error: 'maxTeams' });
  });

  it('RQ-03.3 accepts "leones" once "Leones" is no longer registered', () => {
    expect(validateNewTeamName(teams('Tigres', 'Pumas'), 'leones')).toEqual({ ok: true, value: 'leones' });
  });
});
