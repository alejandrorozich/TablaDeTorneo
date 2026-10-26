import { useId } from 'react';
import { generateFixture } from '../domain/fixture';
import type { MatchId, Result, Team, TeamId } from '../domain/types';
import styles from './FixtureSection.module.css';
import { MatchRow } from './MatchRow';
import { texts } from './texts';

interface FixtureSectionProps {
  teams: readonly Team[];
  results: Readonly<Record<MatchId, Result>>;
  onSave: (matchId: MatchId, result: Result) => void;
  onDelete: (matchId: MatchId) => void;
}

export function FixtureSection({ teams, results, onSave, onDelete }: FixtureSectionProps) {
  const id = useId();
  const rounds = generateFixture(teams);
  const nameOf = (teamId: TeamId) => teams.find((team) => team.id === teamId)?.name ?? '';

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{texts.fixtureTitle}</h2>
      {rounds.length === 0 ? (
        <p className={styles.empty}>{texts.fixtureEmpty}</p>
      ) : (
        rounds.map((round) => (
          <section key={round.number} className={styles.round} aria-labelledby={`${id}-round-${round.number}`}>
            <h3 id={`${id}-round-${round.number}`}>{texts.roundTitle(round.number)}</h3>
            <ul className={styles.matches}>
              {round.matches.map((match) => (
                <MatchRow
                  key={match.id}
                  homeName={nameOf(match.homeId)}
                  awayName={nameOf(match.awayId)}
                  result={results[match.id]}
                  onSave={(result) => onSave(match.id, result)}
                  onDelete={() => onDelete(match.id)}
                />
              ))}
            </ul>
            {round.byeTeamId && <p className={styles.bye}>{texts.bye(nameOf(round.byeTeamId))}</p>}
          </section>
        ))
      )}
    </section>
  );
}
