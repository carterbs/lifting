import styles from './BreathingCircle.module.css';

interface BreathingCircleProps {
  isPaused: boolean;
}

export function BreathingCircle({ isPaused }: BreathingCircleProps): JSX.Element {
  return (
    <div className={styles['container']}>
      <div className={`${styles['circle']} ${isPaused ? styles['paused'] : ''}`} />
    </div>
  );
}
