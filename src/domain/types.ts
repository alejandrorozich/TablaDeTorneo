export type TeamId = string;
export type MatchId = string;

export interface Team {
  readonly id: TeamId;
  readonly name: string;
}

export interface Match {
  readonly id: MatchId;
  readonly round: number;
  readonly homeId: TeamId;
  readonly awayId: TeamId;
}

export interface Round {
  readonly number: number;
  readonly matches: readonly Match[];
  readonly byeTeamId: TeamId | null;
}

export interface Result {
  readonly homeGoals: number;
  readonly awayGoals: number;
}

export interface Tournament {
  readonly teams: readonly Team[];
  readonly nextTeamNumber: number;
  readonly results: Readonly<Record<MatchId, Result>>;
}

export interface StandingRow {
  readonly position: number;
  readonly teamId: TeamId;
  readonly name: string;
  readonly played: number;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDifference: number;
  readonly points: number;
}

export type TeamNameError = 'empty' | 'tooLong' | 'duplicate' | 'maxTeams';

export type ValidationResult<T, E> = { ok: true; value: T } | { ok: false; error: E };
