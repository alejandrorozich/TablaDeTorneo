import { emptyTournament, STORAGE_VERSION, validateTournament } from '../domain/tournament';
import type { Tournament } from '../domain/types';
import type { AppState } from './tournamentReducer';

export const STORAGE_KEY = 'tabla-torneo';

export type LoadResult = { kind: 'empty' } | { kind: 'ok'; tournament: Tournament } | { kind: 'corrupt' };

/** Reads the saved tournament (plan ADR-4). A storage that throws is treated as empty. */
export function loadTournament(storage: Storage = localStorage): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { kind: 'empty' };
  }
  if (raw === null) return { kind: 'empty' };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { kind: 'corrupt' };
  }
  const tournament = validateTournament(data);
  return tournament ? { kind: 'ok', tournament } : { kind: 'corrupt' };
}

/** Writes the tournament; failures (private mode, quota) are ignored so the app keeps working. */
export function saveTournament(tournament: Tournament, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...tournament }));
  } catch {
    // The app keeps working in memory.
  }
}

export function initialStateFromStorage(): AppState {
  const loaded = loadTournament();
  switch (loaded.kind) {
    case 'ok':
      return { tournament: loaded.tournament, storageNotice: false };
    case 'corrupt':
      return { tournament: emptyTournament, storageNotice: true };
    case 'empty':
      return { tournament: emptyTournament, storageNotice: false };
  }
}
