import { MAX_TEAMS, MIN_TEAMS } from './tournament';
import type { Match, MatchId, Round, Team, TeamId } from './types';

function teamNumber(id: TeamId): number {
  return Number(id.slice(1));
}

/** Identifies the pair of teams regardless of home/away: ids sorted by number, joined by ":". */
export function matchId(a: TeamId, b: TeamId): MatchId {
  return teamNumber(a) <= teamNumber(b) ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Round-robin fixture built with the circle method exactly as described in spec RQ-04.
 * `null` marks the BYE slot added when the number of teams is odd.
 */
export function generateFixture(teams: readonly Team[]): Round[] {
  if (teams.length < MIN_TEAMS || teams.length > MAX_TEAMS) return [];

  let slots: (TeamId | null)[] = teams.map((team) => team.id);
  if (slots.length % 2 === 1) slots.push(null);
  const size = slots.length;

  const rounds: Round[] = [];
  for (let number = 1; number <= size - 1; number++) {
    const matches: Match[] = [];
    let byeTeamId: TeamId | null = null;

    for (let i = 0; i < size / 2; i++) {
      let home = slots[i] ?? null;
      let away = slots[size - 1 - i] ?? null;
      if (home === null || away === null) {
        byeTeamId = home ?? away;
        continue;
      }
      if (i === 0 && number % 2 === 0) [home, away] = [away, home];
      matches.push({ id: matchId(home, away), round: number, homeId: home, awayId: away });
    }

    rounds.push({ number, matches, byeTeamId });
    // Keep slot 0 fixed; the last slot moves to position 1 and the rest shift right.
    slots = [slots[0] ?? null, slots[size - 1] ?? null, ...slots.slice(1, size - 1)];
  }
  return rounds;
}
