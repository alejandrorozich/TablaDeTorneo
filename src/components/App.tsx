import { texts } from './texts';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>{texts.appTitle}</h1>
    </main>
  );
}
