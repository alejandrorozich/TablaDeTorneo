import { isLocked } from '../domain/tournament';
import { useTournament } from '../state/useTournament';
import styles from './App.module.css';
import { FixtureSection } from './FixtureSection';
import { StandingsTable } from './StandingsTable';
import { StorageNotice } from './StorageNotice';
import { TeamsSection } from './TeamsSection';
import { texts } from './texts';

export function App() {
  const [{ tournament, storageNotice }, dispatch] = useTournament();

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>{texts.appTitle}</h1>
      {storageNotice && <StorageNotice onDismiss={() => dispatch({ type: 'storageNoticeDismissed' })} />}
      <TeamsSection
        teams={tournament.teams}
        locked={isLocked(tournament)}
        onAdd={(name) => dispatch({ type: 'teamAdded', name })}
        onRemove={(teamId) => dispatch({ type: 'teamRemoved', teamId })}
      />
      <FixtureSection
        teams={tournament.teams}
        results={tournament.results}
        onSave={(matchId, result) => dispatch({ type: 'resultSaved', matchId, result })}
        onDelete={(matchId) => dispatch({ type: 'resultDeleted', matchId })}
      />
      <StandingsTable teams={tournament.teams} results={tournament.results} />
    </main>
  );
}
