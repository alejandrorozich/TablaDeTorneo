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

const collator = new Intl.Collator('es', { sensitivity: 'accent' });

/** Spanish alphabetical order; the code-point fallback only guarantees a total order. */
function compareNames(a: string, b: string): number {
  const byCollator = collator.compare(a, b);
  if (byCollator !== 0) return byCollator;
  const keyA = a.toLowerCase();
  const keyB = b.toLowerCase();
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}

function compareOverall(a: Stats, b: Stats): number {
  return b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;
}

/** Points each team of the group earned only in played matches against other teams of the group. */
function pointsAmong(
  group: readonly Stats[],
  fixture: readonly Round[],
  results: Readonly<Record<MatchId, Result>>,
): Map<TeamId, number> {
  const points = new Map<TeamId, number>(group.map((s) => [s.teamId, 0]));
  for (const match of fixture.flatMap((round) => round.matches)) {
    const result = results[match.id];
    const home = points.get(match.homeId);
    const away = points.get(match.awayId);
    if (!result || home === undefined || away === undefined) continue;
    const { homeGoals, awayGoals } = result;
    points.set(match.homeId, home + (homeGoals > awayGoals ? 3 : homeGoals === awayGoals ? 1 : 0));
    points.set(match.awayId, away + (awayGoals > homeGoals ? 3 : homeGoals === awayGoals ? 1 : 0));
  }
  return points;
}

/** Groups consecutive rows tied on points, goal difference and goals for. */
function tiedGroups(sorted: readonly Stats[]): Stats[][] {
  const groups: Stats[][] = [];
  for (const stats of sorted) {
    const current = groups[groups.length - 1];
    const first = current?.[0];
    if (current && first && compareOverall(first, stats) === 0) current.push(stats);
    else groups.push([stats]);
  }
  return groups;
}

/**
 * Standings table ordered as in spec RQ-10 and RQ-11: points, goal difference, goals for,
 * points among the tied teams (applied once per tied group) and Spanish alphabetical order.
 */
export function computeStandings(
  teams: readonly Team[],
  fixture: readonly Round[],
  results: Readonly<Record<MatchId, Result>>,
): StandingRow[] {
  const sorted = [...computeStats(teams, fixture, results)].sort(compareOverall);
  const ordered = tiedGroups(sorted).flatMap((group) => {
    if (group.length === 1) return group;
    const headToHead = pointsAmong(group, fixture, results);
    return [...group].sort(
      (a, b) =>
        (headToHead.get(b.teamId) ?? 0) - (headToHead.get(a.teamId) ?? 0) || compareNames(a.name, b.name),
    );
  });
  return ordered.map((stats, index) => ({ ...stats, position: index + 1 }));
}

export function formatGoalDifference(goalDifference: number): string {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}
