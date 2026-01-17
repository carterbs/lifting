import { useState } from 'react';
import { Container, Flex, Heading } from '@radix-ui/themes';
import type { Exercise } from '@lifting/shared';
import {
  ExerciseList,
  AddExerciseForm,
  EditExerciseDialog,
  DeleteExerciseDialog,
} from '../components/ExerciseLibrary';

export function ExerciseLibraryPage(): JSX.Element {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  return (
    <Container size="2" p="4">
      <Flex direction="column" gap="4">
        <Heading size="6">Exercise Library</Heading>

        <AddExerciseForm />

        <ExerciseList
          onEdit={setEditingExercise}
          onDelete={setDeletingExercise}
        />

        <EditExerciseDialog
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
        />

        <DeleteExerciseDialog
          exercise={deletingExercise}
          onClose={() => setDeletingExercise(null)}
        />
      </Flex>
    </Container>
  );
}
