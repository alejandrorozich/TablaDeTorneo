import { generateFixture } from '../domain/fixture';
import { isValidGoals } from '../domain/goals';
import { validateNewTeamName } from '../domain/teamName';
import { emptyTournament, isLocked } from '../domain/tournament';
import type { MatchId, Result, TeamId, Tournament } from '../domain/types';

export interface AppState {
  readonly tournament: Tournament;
  readonly storageNotice: boolean;
}

export type Action =
  | { type: 'teamAdded'; name: string }
  | { type: 'teamRemoved'; teamId: TeamId }
  | { type: 'resultSaved'; matchId: MatchId; result: Result }
  | { type: 'resultDeleted'; matchId: MatchId }
  | { type: 'storageNoticeDismissed' };

export const initialState: AppState = { tournament: emptyTournament, storageNotice: false };

function withTournament(state: AppState, tournament: Tournament): AppState {
  return { ...state, tournament };
}

/**
 * Applies the business rules again (lock, validation) so invalid actions are ignored no matter
 * where they come from (plan ADR-5, spec RQ-12.2). Ignored actions return the same state.
 */
export function tournamentReducer(state: AppState, action: Action): AppState {
  const { tournament } = state;
  switch (action.type) {
    case 'teamAdded': {
      if (isLocked(tournament)) return state;
      const validation = validateNewTeamName(tournament.teams, action.name);
      if (!validation.ok) return state;
      const team = { id: `t${tournament.nextTeamNumber}`, name: validation.value };
      return withTournament(state, {
        ...tournament,
        teams: [...tournament.teams, team],
        nextTeamNumber: tournament.nextTeamNumber + 1,
      });
    }
    case 'teamRemoved': {
      if (isLocked(tournament) || !tournament.teams.some((t) => t.id === action.teamId)) return state;
      return withTournament(state, {
        ...tournament,
        teams: tournament.teams.filter((t) => t.id !== action.teamId),
      });
    }
    case 'resultSaved': {
      const { matchId, result } = action;
      const exists = generateFixture(tournament.teams).some((round) => round.matches.some((m) => m.id === matchId));
      if (!exists || !isValidGoals(result.homeGoals) || !isValidGoals(result.awayGoals)) return state;
      return withTournament(state, { ...tournament, results: { ...tournament.results, [matchId]: result } });
    }
    case 'resultDeleted': {
      if (!(action.matchId in tournament.results)) return state;
      const { [action.matchId]: _removed, ...results } = tournament.results;
      return withTournament(state, { ...tournament, results });
    }
    case 'storageNoticeDismissed':
      return state.storageNotice ? { ...state, storageNotice: false } : state;
  }
}
