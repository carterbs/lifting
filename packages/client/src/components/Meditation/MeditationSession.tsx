/**
 * Meditation Session Component
 *
 * Active meditation session view showing:
 * - Breathing circle animation (the focus of the session)
 * - Large countdown timer
 * - Current phase indicator
 * - Minimal controls (Pause/Resume and End only)
 * - Audio error overlay
 */

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  AlertDialog,
} from '@radix-ui/themes';
import type { AudioErrorState } from '../../hooks/useMeditationSession';
import { BreathingCircle } from './BreathingCircle';
import styles from './MeditationSession.module.css';

interface MeditationSessionProps {
  sessionName: string;
  remainingSeconds: number;
  totalSeconds: number;
  currentPhase: 'intro' | 'breathing' | 'closing' | null;
  isPaused: boolean;
  audioError: AudioErrorState | null;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onRetryAudio: () => Promise<void>;
  onSkipAudio: () => void;
}

export function MeditationSession({
  sessionName,
  remainingSeconds,
  totalSeconds: _totalSeconds,
  currentPhase,
  isPaused,
  audioError,
  onPause,
  onResume,
  onEnd,
  onRetryAudio,
  onSkipAudio,
}: MeditationSessionProps): JSX.Element {
  // _totalSeconds is available if we need to show progress in the future
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase label for display
  const getPhaseLabel = (): string => {
    switch (currentPhase) {
      case 'intro':
        return 'Introduction';
      case 'breathing':
        return 'Breathing';
      case 'closing':
        return 'Closing';
      default:
        return '';
    }
  };

  return (
    <Box className={styles['container']}>
      {/* Session Header */}
      <Box className={styles['header']}>
        <Text size="2" color="gray">
          {sessionName}
        </Text>
      </Box>

      {/* Breathing Animation - The Focus */}
      <Box className={styles['breathingContainer']}>
        <BreathingCircle isPaused={isPaused} />
      </Box>

      {/* Timer Section */}
      <Box className={styles['timerSection']}>
        <Text
          className={`${styles['timer']} ${isPaused ? styles['paused'] : ''}`}
        >
          {formatTime(remainingSeconds)}
        </Text>
        <Text className={styles['phaseLabel']} size="2" color="gray">
          {getPhaseLabel()}
        </Text>
      </Box>

      {/* Controls - Fixed at Bottom */}
      <Box className={styles['controls']}>
        <Flex className={styles['mainControls']}>
          <Button
            size="3"
            variant="soft"
            color="red"
            onClick={() => setShowEndConfirm(true)}
          >
            End
          </Button>
          <Button size="3" onClick={isPaused ? onResume : onPause}>
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </Flex>
      </Box>

      {/* End Confirmation Dialog */}
      <AlertDialog.Root open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialog.Content maxWidth="320px">
          <AlertDialog.Title>End Session?</AlertDialog.Title>
          <AlertDialog.Description>
            <Text color="gray">
              Are you sure you want to end your meditation session early?
            </Text>
          </AlertDialog.Description>
          <Flex gap="3" justify="end" mt="4">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              color="red"
              onClick={() => {
                setShowEndConfirm(false);
                onEnd();
              }}
            >
              End Session
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Audio Error Overlay */}
      {audioError !== null && (
        <Box className={styles['errorOverlay']}>
          <Box className={styles['errorDialog']}>
            <Heading size="4" mb="2">
              Audio Error
            </Heading>
            <Text as="p" size="2" color="gray" mb="4">
              {audioError.message}
            </Text>
            <Flex gap="3" justify="center">
              <Button variant="soft" color="gray" onClick={onSkipAudio}>
                Skip
              </Button>
              <Button onClick={() => void onRetryAudio()}>Retry</Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
