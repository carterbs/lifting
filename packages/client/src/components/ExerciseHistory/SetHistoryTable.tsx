import type { ExerciseHistoryEntry } from '@lifting/shared';

interface Props {
  entries: ExerciseHistoryEntry[];
}

export function SetHistoryTable({ entries }: Props): JSX.Element {
  // Display entries in reverse chronological order
  const reversedEntries = [...entries].reverse();

  return (
    <div className="set-history-table" data-testid="set-history-table">
      <h2>Set History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Best Weight</th>
            <th>Reps</th>
            <th>Sets</th>
          </tr>
        </thead>
        <tbody>
          {reversedEntries.map(entry => (
            <tr key={entry.workout_id}>
              <td>{new Date(entry.date).toLocaleDateString()}</td>
              <td>{entry.best_weight} lbs</td>
              <td>{entry.best_set_reps}</td>
              <td>{entry.sets.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
