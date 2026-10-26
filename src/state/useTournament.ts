import { type Dispatch, useEffect, useReducer, useRef } from 'react';
import { initialStateFromStorage, saveTournament } from './storage';
import { type Action, type AppState, tournamentReducer } from './tournamentReducer';

/**
 * Tournament state loaded from localStorage and saved after every change. The initial state is
 * not written back, so corrupt data is only overwritten by the first change (spec RQ-14.4).
 */
export function useTournament(): [AppState, Dispatch<Action>] {
  const [state, dispatch] = useReducer(tournamentReducer, undefined, initialStateFromStorage);
  const lastSaved = useRef(state.tournament);

  useEffect(() => {
    if (state.tournament === lastSaved.current) return;
    saveTournament(state.tournament);
    lastSaved.current = state.tournament;
  }, [state.tournament]);

  return [state, dispatch];
}
