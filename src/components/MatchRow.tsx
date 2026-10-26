import { type FormEvent, useId, useState } from 'react';
import { parseGoals } from '../domain/goals';
import type { Result } from '../domain/types';
import styles from './MatchRow.module.css';
import { texts } from './texts';

interface MatchRowProps {
  homeName: string;
  awayName: string;
  result: Result | undefined;
  onSave: (result: Result) => void;
  onDelete: () => void;
}

/** One fixture match: pending (goal fields), played (score) or being edited (plan ADR-6). */
export function MatchRow({ homeName, awayName, result, onSave, onDelete }: MatchRowProps) {
  const [editing, setEditing] = useState(false);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [invalid, setInvalid] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;
  const label = texts.match(homeName, awayName);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const homeGoals = parseGoals(home);
    const awayGoals = parseGoals(away);
    if (homeGoals === null || awayGoals === null) {
      setInvalid(true);
      return;
    }
    onSave({ homeGoals, awayGoals });
    setEditing(false);
    setInvalid(false);
  };

  const startEditing = (current: Result) => {
    setHome(String(current.homeGoals));
    setAway(String(current.awayGoals));
    setInvalid(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setInvalid(false);
  };

  const deleteResult = () => {
    setHome('');
    setAway('');
    setInvalid(false);
    onDelete();
  };

  const matchLabel = (
    <span className={styles.match} data-match>
      {label}
    </span>
  );

  if (result && !editing) {
    return (
      <li className={styles.row}>
        {matchLabel}
        <span className={styles.score}>{texts.score(result.homeGoals, result.awayGoals)}</span>
        <span className={styles.actions}>
          <button type="button" aria-label={`${texts.edit} ${label}`} onClick={() => startEditing(result)}>
            {texts.edit}
          </button>
          <button type="button" aria-label={`${texts.remove} ${label}`} onClick={deleteResult}>
            {texts.remove}
          </button>
        </span>
      </li>
    );
  }

  const goalsInput = (team: string, value: string, setValue: (value: string) => void) => {
    const inputId = `${id}-${team === homeName ? 'home' : 'away'}`;
    return (
      <span className={styles.goals}>
        <label className={styles.srOnly} htmlFor={inputId}>
          {texts.goalsLabel(team)}
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          size={2}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
        />
      </span>
    );
  };

  return (
    <li className={styles.row}>
      {matchLabel}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {goalsInput(homeName, home, setHome)}
        <span aria-hidden="true">-</span>
        {goalsInput(awayName, away, setAway)}
        <span className={styles.actions}>
          <button type="submit" aria-label={`${texts.save} ${label}`}>
            {texts.save}
          </button>
          {editing && (
            <button type="button" aria-label={`${texts.cancel} ${label}`} onClick={cancelEditing}>
              {texts.cancel}
            </button>
          )}
        </span>
      </form>
      {invalid && (
        <p id={errorId} className={styles.error} role="alert">
          {texts.errorGoals}
        </p>
      )}
    </li>
  );
}
