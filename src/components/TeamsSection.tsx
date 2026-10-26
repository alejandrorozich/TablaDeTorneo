import { type FormEvent, useId, useState } from 'react';
import { validateNewTeamName } from '../domain/teamName';
import type { Team, TeamId, TeamNameError } from '../domain/types';
import styles from './TeamsSection.module.css';
import { texts } from './texts';

const errorTexts: Record<TeamNameError, string> = {
  empty: texts.errorEmptyName,
  duplicate: texts.errorDuplicateName,
  tooLong: texts.errorLongName,
  maxTeams: texts.errorMaxTeams,
};

interface TeamsSectionProps {
  teams: readonly Team[];
  locked: boolean;
  onAdd: (name: string) => void;
  onRemove: (teamId: TeamId) => void;
}

export function TeamsSection({ teams, locked, onAdd, onRemove }: TeamsSectionProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<TeamNameError | null>(null);
  const id = useId();
  const inputId = `${id}-name`;
  const errorId = `${id}-error`;
  const titleId = `${id}-title`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    const validation = validateNewTeamName(teams, name);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    onAdd(validation.value);
    setName('');
    setError(null);
  };

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId}>{texts.teamsTitle}</h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.fieldset} disabled={locked}>
          <label htmlFor={inputId}>{texts.teamNameLabel}</label>
          <div className={styles.row}>
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error ? errorId : undefined}
            />
            <button type="submit">{texts.addTeam}</button>
          </div>
        </fieldset>
        {error && !locked && (
          <p id={errorId} className={styles.error} role="alert">
            {errorTexts[error]}
          </p>
        )}
      </form>

      {locked && (
        <p className={styles.locked} role="status">
          {texts.teamsLocked}
        </p>
      )}

      <p className={styles.count}>{texts.teamCount(teams.length)}</p>

      {teams.length === 0 ? (
        <p className={styles.empty}>{texts.teamsEmpty}</p>
      ) : (
        <ol className={styles.list}>
          {teams.map((team) => (
            <li key={team.id} className={styles.item}>
              <span>{team.name}</span>
              <button
                type="button"
                aria-label={texts.removeTeamLabel(team.name)}
                disabled={locked}
                onClick={() => onRemove(team.id)}
              >
                {texts.removeTeam}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
