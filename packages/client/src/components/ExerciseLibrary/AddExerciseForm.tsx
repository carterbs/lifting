import { useState } from 'react';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { useCreateExercise } from '../../hooks/useExercises';

export function AddExerciseForm(): JSX.Element {
  const [name, setName] = useState('');
  const [weightIncrement, setWeightIncrement] = useState('5');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createExercise = useCreateExercise();

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Exercise name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setValidationError('Exercise name must be 100 characters or less');
      return;
    }

    // Validate weight increment
    const increment = parseFloat(weightIncrement);
    if (isNaN(increment) || increment <= 0) {
      setValidationError('Weight increment must be a positive number');
      return;
    }

    setValidationError(null);

    createExercise.mutate(
      { name: trimmedName, weight_increment: increment },
      {
        onSuccess: () => {
          setName('');
          setWeightIncrement('5');
        },
      }
    );
  };

  const isSubmitDisabled = !name.trim() || createExercise.isPending;

  return (
    <Box
      p="4"
      style={{
        backgroundColor: 'var(--gray-2)',
        borderRadius: 'var(--radius-3)',
      }}
    >
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Text weight="medium" size="3">Add Custom Exercise</Text>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: '1 1 200px' }}>
              <Text as="label" size="2" weight="medium" htmlFor="exercise-name">
                Exercise Name
              </Text>
              <TextField.Root
                id="exercise-name"
                placeholder="e.g., Barbell Squat"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onBlur={() => {
                  if (!name.trim()) {
                    setValidationError('Exercise name is required');
                  }
                }}
              />
            </Box>

            <Box style={{ flex: '0 0 120px' }}>
              <Text as="label" size="2" weight="medium" htmlFor="weight-increment">
                Weight Increment (lbs)
              </Text>
              <TextField.Root
                id="weight-increment"
                type="number"
                min="0.5"
                step="0.5"
                value={weightIncrement}
                onChange={(e) => {
                  setWeightIncrement(e.target.value);
                  if (validationError) setValidationError(null);
                }}
              />
            </Box>

            <Box style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
              <Button type="submit" disabled={isSubmitDisabled}>
                {createExercise.isPending ? 'Adding...' : 'Add Exercise'}
              </Button>
            </Box>
          </Flex>

          {validationError && (
            <Text color="red" size="2">
              {validationError}
            </Text>
          )}

          {createExercise.isError && (
            <Text color="red" size="2">
              {createExercise.error.message}
            </Text>
          )}
        </Flex>
      </form>
    </Box>
  );
}
