/**
 * Meditation Audio Playback Engine
 *
 * Handles audio playback for guided meditation sessions using <audio> elements.
 * Integrates with MediaSession API for lock screen controls.
 *
 * Uses <audio> elements instead of Web Audio API because:
 * 1. <audio> integrates with OS media session for background playback
 * 2. Web Audio API AudioContext gets suspended when app is backgrounded on mobile
 * 3. We need lock screen controls (play/pause) via MediaSession
 */

import { getMeditationAssetUrl } from './meditationData';

// Singleton audio elements
let narrationAudio: HTMLAudioElement | null = null;
let bellAudio: HTMLAudioElement | null = null;
let keepaliveAudio: HTMLAudioElement | null = null;
let isInitialized = false;
let isKeepaliveRunning = false;

// Callbacks for MediaSession actions
let onPauseCallback: (() => void) | null = null;
let onPlayCallback: (() => void) | null = null;

/**
 * Error thrown when audio playback fails.
 */
export class MeditationAudioPlaybackError extends Error {
  constructor(
    message: string,
    public readonly clipPath: string
  ) {
    super(message);
    this.name = 'MeditationAudioPlaybackError';
  }
}

/**
 * Initialize the meditation audio system.
 * MUST be called during a user gesture (click, touch) to work on iOS.
 *
 * This creates the audio elements and unlocks playback. Safe to call multiple times.
 */
export function initMeditationAudio(): void {
  if (isInitialized) {
    console.log('[MeditationAudio] Already initialized, skipping');
    return;
  }
  console.log('[MeditationAudio] Initializing audio system...');

  // Create narration audio element
  narrationAudio = new Audio();
  narrationAudio.preload = 'auto';

  // Create bell audio element
  bellAudio = new Audio();
  bellAudio.preload = 'auto';

  // Create keepalive audio element for silent loop
  keepaliveAudio = new Audio();
  keepaliveAudio.preload = 'auto';
  keepaliveAudio.loop = true;
  keepaliveAudio.volume = 0.01; // Nearly silent but maintains audio session

  // Set up MediaSession handlers if available
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('pause', () => {
      onPauseCallback?.();
    });

    navigator.mediaSession.setActionHandler('play', () => {
      onPlayCallback?.();
    });

    // No "next track" for meditation - it's a continuous session
  }

  isInitialized = true;
  console.log('[MeditationAudio] Audio system initialized');
}

/**
 * Check if the audio system is initialized.
 */
export function isMeditationAudioInitialized(): boolean {
  return isInitialized;
}

/**
 * Set callbacks for MediaSession actions.
 * These are called when the user interacts with lock screen controls.
 */
export function setMeditationMediaSessionCallbacks(callbacks: {
  onPause?: () => void;
  onPlay?: () => void;
}): void {
  onPauseCallback = callbacks.onPause ?? null;
  onPlayCallback = callbacks.onPlay ?? null;
}

/**
 * Play a narration audio clip.
 *
 * Pauses the keepalive loop while playing, resumes after.
 * Resolves when the clip finishes playing.
 * Rejects with MeditationAudioPlaybackError if the clip fails to load.
 *
 * @param clipPath - Relative path to the audio clip (e.g., "sessions/basic-breathing/intro-welcome.wav")
 * @returns Promise that resolves when playback completes
 */
export async function playMeditationNarration(clipPath: string): Promise<void> {
  console.log(`[MeditationAudio] Playing narration: ${clipPath}`);
  if (!narrationAudio) {
    throw new Error('Audio not initialized. Call initMeditationAudio() first.');
  }

  // Pause keepalive during narration
  const wasKeepaliveRunning = isKeepaliveRunning;
  if (wasKeepaliveRunning) {
    pauseKeepalive();
  }

  const url = getMeditationAssetUrl(clipPath);
  console.log(`[MeditationAudio] Narration URL: ${url}`);

  return new Promise((resolve, reject) => {
    if (!narrationAudio) {
      reject(new Error('Audio element not available'));
      return;
    }

    const cleanup = (): void => {
      if (narrationAudio) {
        narrationAudio.onended = null;
        narrationAudio.onerror = null;
        narrationAudio.oncanplaythrough = null;
      }
    };

    narrationAudio.onended = (): void => {
      console.log(`[MeditationAudio] Narration ended: ${clipPath}`);
      cleanup();
      // Resume keepalive after narration
      if (wasKeepaliveRunning) {
        startMeditationKeepalive();
      }
      resolve();
    };

    narrationAudio.onerror = (): void => {
      console.error(`[MeditationAudio] Narration error: ${clipPath}`, narrationAudio?.error);
      cleanup();
      // Resume keepalive even on error
      if (wasKeepaliveRunning) {
        startMeditationKeepalive();
      }
      reject(new MeditationAudioPlaybackError(`Failed to load audio: ${url}`, clipPath));
    };

    narrationAudio.src = url;
    narrationAudio.load();

    // Start playback
    const playPromise = narrationAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error: Error) => {
        cleanup();
        if (wasKeepaliveRunning) {
          startMeditationKeepalive();
        }
        reject(new MeditationAudioPlaybackError(`Playback failed: ${error.message}`, clipPath));
      });
    }
  });
}

/**
 * Play the meditation bell sound.
 * Used at session start and end.
 *
 * @returns Promise that resolves when the bell finishes playing
 */
export async function playMeditationBell(): Promise<void> {
  console.log('[MeditationAudio] Playing bell');
  if (!bellAudio) {
    throw new Error('Audio not initialized. Call initMeditationAudio() first.');
  }

  // Pause keepalive during bell
  const wasKeepaliveRunning = isKeepaliveRunning;
  if (wasKeepaliveRunning) {
    pauseKeepalive();
  }

  const url = getMeditationAssetUrl('shared/bell.wav');
  console.log(`[MeditationAudio] Bell URL: ${url}`);

  return new Promise((resolve, reject) => {
    if (!bellAudio) {
      reject(new Error('Bell audio element not available'));
      return;
    }

    const cleanup = (): void => {
      if (bellAudio) {
        bellAudio.onended = null;
        bellAudio.onerror = null;
      }
    };

    bellAudio.onended = (): void => {
      console.log('[MeditationAudio] Bell ended');
      cleanup();
      if (wasKeepaliveRunning) {
        startMeditationKeepalive();
      }
      resolve();
    };

    bellAudio.onerror = (): void => {
      console.error('[MeditationAudio] Bell error', bellAudio?.error);
      cleanup();
      if (wasKeepaliveRunning) {
        startMeditationKeepalive();
      }
      reject(new MeditationAudioPlaybackError('Failed to load bell sound', 'shared/bell.wav'));
    };

    bellAudio.src = url;
    bellAudio.load();

    const playPromise = bellAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error: Error) => {
        cleanup();
        if (wasKeepaliveRunning) {
          startMeditationKeepalive();
        }
        reject(new MeditationAudioPlaybackError(`Bell playback failed: ${error.message}`, 'shared/bell.wav'));
      });
    }
  });
}

/**
 * Start the silent keepalive loop.
 * This maintains the audio session and keeps the PWA alive on lock screen.
 */
export function startMeditationKeepalive(): void {
  if (!keepaliveAudio || isKeepaliveRunning) {
    console.log('[MeditationAudio] Keepalive already running or not available');
    return;
  }

  console.log('[MeditationAudio] Starting keepalive');
  const silenceUrl = getMeditationAssetUrl('shared/silence-1s.wav');
  keepaliveAudio.src = silenceUrl;
  keepaliveAudio.load();

  const playPromise = keepaliveAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isKeepaliveRunning = true;
      })
      .catch((error: Error) => {
        console.warn('Failed to start meditation keepalive audio:', error.message);
      });
  }
}

/**
 * Pause the keepalive loop (internal use during narration).
 */
function pauseKeepalive(): void {
  if (!keepaliveAudio) {
    return;
  }
  keepaliveAudio.pause();
  isKeepaliveRunning = false;
}

/**
 * Stop the keepalive loop completely.
 * Call this when ending a session.
 */
export function stopMeditationKeepalive(): void {
  console.log('[MeditationAudio] Stopping keepalive');
  if (!keepaliveAudio) {
    return;
  }
  keepaliveAudio.pause();
  keepaliveAudio.currentTime = 0;
  isKeepaliveRunning = false;
}

/**
 * Check if keepalive is currently running.
 */
export function isMeditationKeepaliveActive(): boolean {
  return isKeepaliveRunning;
}

/**
 * Update MediaSession metadata for lock screen display.
 *
 * @param sessionName - Name of the meditation session (e.g., "Basic Breathing")
 * @param phase - Current phase (e.g., "Introduction", "Breathing", "Closing")
 */
export function setMeditationMediaSessionMetadata(
  sessionName: string,
  phase: string
): void {
  if (!('mediaSession' in navigator)) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: sessionName,
    artist: phase,
    album: 'Meditation',
  });
}

/**
 * Update MediaSession playback state.
 *
 * @param state - The playback state ('playing', 'paused', or 'none')
 */
export function setMeditationMediaSessionPlaybackState(
  state: 'playing' | 'paused' | 'none'
): void {
  if (!('mediaSession' in navigator)) {
    return;
  }

  navigator.mediaSession.playbackState = state;
}

/**
 * Stop the current narration audio.
 * Call this when ending a session early to interrupt any playing narration.
 */
export function stopMeditationNarration(): void {
  if (narrationAudio) {
    narrationAudio.pause();
    narrationAudio.currentTime = 0;
    narrationAudio.onended = null;
    narrationAudio.onerror = null;
  }
}

/**
 * Stop all audio and clean up.
 * Call this when ending a session or unmounting.
 */
export function stopAllMeditationAudio(): void {
  stopMeditationNarration();

  if (bellAudio) {
    bellAudio.pause();
    bellAudio.currentTime = 0;
    bellAudio.onended = null;
    bellAudio.onerror = null;
  }

  stopMeditationKeepalive();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  }
}

/**
 * Reset the audio system.
 * Primarily for testing purposes.
 */
export function resetMeditationAudio(): void {
  stopAllMeditationAudio();
  narrationAudio = null;
  bellAudio = null;
  keepaliveAudio = null;
  isInitialized = false;
  isKeepaliveRunning = false;
  onPauseCallback = null;
  onPlayCallback = null;
}
