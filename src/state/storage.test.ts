import { describe, expect, it } from 'vitest';
import { buildTournament, specExamples } from '../domain/testUtils';
import { emptyTournament } from '../domain/tournament';
import { initialStateFromStorage, loadTournament, saveTournament, STORAGE_KEY } from './storage';

const sample = () => buildTournament(specExamples.rq09_1.names, specExamples.rq09_1.scores);

/** A Storage whose every method throws, like a blocked localStorage. */
const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
} as unknown as Storage;

describe('storage', () => {
  it('RQ-13.1 saving and loading returns the same tournament (round trip)', () => {
    saveTournament(sample());
    expect(loadTournament()).toEqual({ kind: 'ok', tournament: sample() });
  });

  it('RQ-13.1 stores versioned JSON under the "tabla-torneo" key', () => {
    saveTournament(sample());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toMatchObject({ version: 1, nextTeamNumber: 4 });
  });

  it('RQ-13.2 with no saved data the load result is empty', () => {
    expect(loadTournament()).toEqual({ kind: 'empty' });
    expect(initialStateFromStorage()).toEqual({ tournament: emptyTournament, storageNotice: false });
  });

  it('RQ-13.3 after deleting a result or removing a team the saved data reflects it', () => {
    const { names, scores } = specExamples.rq08_1;
    saveTournament(buildTournament(names, scores));
    expect(loadTournament()).toEqual({ kind: 'ok', tournament: buildTournament(names, scores) });
    saveTournament(buildTournament(['Leones', 'Tigres']));
    expect(loadTournament()).toEqual({ kind: 'ok', tournament: buildTournament(['Leones', 'Tigres']) });
  });

  it('RQ-14.1 unreadable data ("{esto no es válido") is reported as corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es válido');
    expect(loadTournament()).toEqual({ kind: 'corrupt' });
  });

  it('RQ-14.2 readable data with an unknown version is reported as corrupt', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...sample(), version: 2 }));
    expect(loadTournament()).toEqual({ kind: 'corrupt' });
  });

  it('RQ-14.5 with corrupt data the initial state is an empty tournament with the notice on', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...sample(), version: 1, teams: 'x' }));
    expect(initialStateFromStorage()).toEqual({ tournament: emptyTournament, storageNotice: true });
  });

  it('R-4 a throwing localStorage loads as empty and saving does not throw', () => {
    expect(loadTournament(throwingStorage)).toEqual({ kind: 'empty' });
    expect(() => saveTournament(sample(), throwingStorage)).not.toThrow();
  });
});
