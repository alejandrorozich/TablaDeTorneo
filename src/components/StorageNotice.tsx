import styles from './StorageNotice.module.css';
import { texts } from './texts';

interface StorageNoticeProps {
  onDismiss: () => void;
}

/** Shown when the saved data could not be recovered (spec RQ-14). */
export function StorageNotice({ onDismiss }: StorageNoticeProps) {
  return (
    <div className={styles.notice} role="alert">
      <p>{texts.storageCorrupt}</p>
      <button type="button" onClick={onDismiss}>
        {texts.dismiss}
      </button>
    </div>
  );
}
