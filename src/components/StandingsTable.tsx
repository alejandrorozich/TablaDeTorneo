import { useId } from 'react';
import { generateFixture } from '../domain/fixture';
import { computeStandings, formatGoalDifference } from '../domain/standings';
import { MIN_TEAMS } from '../domain/tournament';
import type { MatchId, Result, StandingRow, Team } from '../domain/types';
import styles from './StandingsTable.module.css';
import { texts } from './texts';

interface StandingsTableProps {
  teams: readonly Team[];
  results: Readonly<Record<MatchId, Result>>;
}

const TEAM_COLUMN = 1;

function cells(row: StandingRow): (string | number)[] {
  return [
    row.played,
    row.won,
    row.drawn,
    row.lost,
    row.goalsFor,
    row.goalsAgainst,
    formatGoalDifference(row.goalDifference),
    row.points,
  ];
}

export function StandingsTable({ teams, results }: StandingsTableProps) {
  const id = useId();
  const titleId = `${id}-title`;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId}>{texts.standingsTitle}</h2>
      {teams.length < MIN_TEAMS ? (
        <p className={styles.empty}>{texts.standingsEmpty}</p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table} aria-labelledby={titleId}>
            <thead>
              <tr>
                {texts.standingsHeaders.map((header, index) => (
                  <th key={header} scope="col" className={index === TEAM_COLUMN ? styles.teamColumn : undefined}>
                    {index === TEAM_COLUMN ? (
                      header
                    ) : (
                      <abbr title={texts.standingsDescriptions[index]}>{header}</abbr>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {computeStandings(teams, generateFixture(teams), results).map((row) => (
                <tr key={row.teamId}>
                  <td>{row.position}</td>
                  <th scope="row" className={styles.teamColumn}>
                    {row.name}
                  </th>
                  {cells(row).map((value, index) => (
                    <td key={index}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
