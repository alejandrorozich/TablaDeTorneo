import type { MatchId, Result, Round, StandingRow, Team, TeamId } from './types';

type Stats = Omit<StandingRow, 'position'>;

function emptyStats(team: Team): Stats {
  return {
    teamId: team.id,
    name: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function addMatch(stats: Stats, own: number, rival: number): Stats {
  const won = stats.won + (own > rival ? 1 : 0);
  const drawn = stats.drawn + (own === rival ? 1 : 0);
  const lost = stats.lost + (own < rival ? 1 : 0);
  const goalsFor = stats.goalsFor + own;
  const goalsAgainst = stats.goalsAgainst + rival;
  return {
    ...stats,
    played: stats.played + 1,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: 3 * won + drawn,
  };
}

function computeStats(
  teams: readonly Team[],
  fixture: readonly Round[],
  results: Readonly<Record<MatchId, Result>>,
): Stats[] {
  const byId = new Map<TeamId, Stats>(teams.map((team) => [team.id, emptyStats(team)]));
  for (const match of fixture.flatMap((round) => round.matches)) {
    const result = results[match.id];
    const home = byId.get(match.homeId);
    const away = byId.get(match.awayId);
    if (!result || !home || !away) continue;
    byId.set(match.homeId, addMatch(home, result.homeGoals, result.awayGoals));
    byId.set(match.awayId, addMatch(away, result.awayGoals, result.homeGoals));
  }
  return teams.map((team) => byId.get(team.id) ?? emptyStats(team));
}

/** Standings table: one row per team, computed only from played matches. */
export function computeStandings(
  teams: readonly Team[],
  fixture: readonly Round[],
  results: Readonly<Record<MatchId, Result>>,
): StandingRow[] {
  return computeStats(teams, fixture, results).map((stats, index) => ({ ...stats, position: index + 1 }));
}

export function formatGoalDifference(goalDifference: number): string {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}
