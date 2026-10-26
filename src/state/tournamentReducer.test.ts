import { describe, expect, it } from 'vitest';
import { buildTournament, specExamples } from '../domain/testUtils';
import { isLocked } from '../domain/tournament';
import type { Tournament } from '../domain/types';
import { type Action, type AppState, initialState, tournamentReducer } from './tournamentReducer';

const stateOf = (tournament: Tournament): AppState => ({ tournament, storageNotice: false });
const run = (state: AppState, ...actions: Action[]) => actions.reduce(tournamentReducer, state);
const add = (name: string): Action => ({ type: 'teamAdded', name });
const names = (state: AppState) => state.tournament.teams.map((t) => t.name);
const unplayed = () => stateOf(buildTournament(['Leones', 'Tigres', 'Pumas']));
const played = () => stateOf(buildTournament(specExamples.rq09_1.names, specExamples.rq09_1.scores));

describe('tournamentReducer', () => {
  it('RQ-01.1 teamAdded adds the team with id t1 and its normalized name', () => {
    const state = run(initialState, add('  Leones  '));
    expect(state.tournament.teams).toEqual([{ id: 't1', name: 'Leones' }]);
    expect(state.tournament.nextTeamNumber).toBe(2);
  });

  it('RQ-01.7 keeps registration order', () => {
    expect(names(run(initialState, add('Leones'), add('Tigres'), add('Pumas')))).toEqual(['Leones', 'Tigres', 'Pumas']);
  });

  it('RQ-01.3 / RQ-01.5 ignores invalid names', () => {
    const state = run(initialState, add('Leones'));
    expect(run(state, add('LEONES'), add('   '))).toBe(state);
  });

  it('RQ-02.1 ignores an eleventh team', () => {
    const ten = run(initialState, ...Array.from({ length: 10 }, (_, i) => add(`E${i + 1}`)));
    expect(ten.tournament.teams).toHaveLength(10);
    expect(run(ten, add('E11'))).toBe(ten);
  });

  it('RQ-03.1 teamRemoved keeps the relative order of the others', () => {
    const state = run(initialState, add('A'), add('B'), add('C'), add('D'));
    expect(names(run(state, { type: 'teamRemoved', teamId: 't2' }))).toEqual(['A', 'C', 'D']);
  });

  it('RQ-03.3 re-adding a removed name gets a new id and goes last', () => {
    const state = run(initialState, add('Leones'), add('Tigres'), { type: 'teamRemoved', teamId: 't1' }, add('leones'));
    expect(state.tournament.teams).toEqual([
      { id: 't2', name: 'Tigres' },
      { id: 't3', name: 'leones' },
    ]);
  });

  it('RQ-06.1 resultSaved stores the result of a pending match', () => {
    const state = run(unplayed(), { type: 'resultSaved', matchId: 't2:t3', result: { homeGoals: 2, awayGoals: 1 } });
    expect(state.tournament.results).toEqual({ 't2:t3': { homeGoals: 2, awayGoals: 1 } });
  });

  it('RQ-06.1 ignores results with invalid goals or for a match that does not exist', () => {
    const state = unplayed();
    expect(run(state, { type: 'resultSaved', matchId: 't2:t3', result: { homeGoals: 100, awayGoals: 1 } })).toBe(state);
    expect(run(state, { type: 'resultSaved', matchId: 't2:t3', result: { homeGoals: 1.5, awayGoals: 1 } })).toBe(state);
    expect(run(state, { type: 'resultSaved', matchId: 't1:t9', result: { homeGoals: 1, awayGoals: 0 } })).toBe(state);
  });

  it('RQ-06.4 / RQ-12.2 with a result, teamAdded and teamRemoved do not change the state', () => {
    const state = run(unplayed(), { type: 'resultSaved', matchId: 't2:t3', result: { homeGoals: 2, awayGoals: 1 } });
    expect(isLocked(state.tournament)).toBe(true);
    expect(run(state, add('Osos'))).toBe(state);
    expect(run(state, { type: 'teamRemoved', teamId: 't1' })).toBe(state);
  });

  it('RQ-07.2 resultSaved on a played match replaces its result', () => {
    const state = run(played(), { type: 'resultSaved', matchId: 't1:t2', result: { homeGoals: 1, awayGoals: 1 } });
    expect(state.tournament).toEqual(buildTournament(specExamples.rq07_2.names, specExamples.rq07_2.scores));
  });

  it('RQ-08.1 resultDeleted makes the match pending again', () => {
    const state = run(played(), { type: 'resultDeleted', matchId: 't1:t2' });
    expect(state.tournament).toEqual(buildTournament(specExamples.rq08_1.names, specExamples.rq08_1.scores));
  });

  it('RQ-08.2 / RQ-12.4 deleting the only result unlocks the team list', () => {
    const state = run(
      unplayed(),
      { type: 'resultSaved', matchId: 't2:t3', result: { homeGoals: 2, awayGoals: 1 } },
      { type: 'resultDeleted', matchId: 't2:t3' },
    );
    expect(isLocked(state.tournament)).toBe(false);
    expect(names(run(state, add('Osos')))).toEqual(['Leones', 'Tigres', 'Pumas', 'Osos']);
  });

  it('RQ-08.3 after deleting a result a new one can be saved', () => {
    const state = run(
      played(),
      { type: 'resultDeleted', matchId: 't1:t2' },
      { type: 'resultSaved', matchId: 't1:t2', result: { homeGoals: 0, awayGoals: 4 } },
    );
    expect(state.tournament.results['t1:t2']).toEqual({ homeGoals: 0, awayGoals: 4 });
  });

  it('RQ-14.3 storageNoticeDismissed hides the corrupt data notice', () => {
    const state = run({ ...initialState, storageNotice: true }, { type: 'storageNoticeDismissed' });
    expect(state.storageNotice).toBe(false);
  });
});
