import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  initMeditationAudio,
  isMeditationAudioInitialized,
  playMeditationNarration,
  playMeditationBell,
  startMeditationKeepalive,
  stopMeditationKeepalive,
  isMeditationKeepaliveActive,
  setMeditationMediaSessionMetadata,
  setMeditationMediaSessionPlaybackState,
  setMeditationMediaSessionCallbacks,
  stopAllMeditationAudio,
  resetMeditationAudio,
  MeditationAudioPlaybackError,
} from '../meditationAudio';

// Mock MediaMetadata (not available in jsdom)
class MockMediaMetadata {
  title: string;
  artist: string;
  album: string;

  constructor(init: { title: string; artist: string; album: string }) {
    this.title = init.title;
    this.artist = init.artist;
    this.album = init.album;
  }
}
(globalThis as unknown as { MediaMetadata: typeof MockMediaMetadata }).MediaMetadata =
  MockMediaMetadata;

// Mock HTMLAudioElement
class MockAudioElement {
  src = '';
  preload = '';
  loop = false;
  volume = 1;
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  oncanplaythrough: (() => void) | null = null;

  load = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
}

describe('meditationAudio', () => {
  let mockAudioElements: MockAudioElement[];
  let originalAudio: typeof Audio;
  let mockMediaSession: {
    metadata: MockMediaMetadata | null;
    playbackState: string;
    setActionHandler: Mock;
  };

  beforeEach(() => {
    resetMeditationAudio();
    mockAudioElements = [];

    // Mock Audio constructor
    originalAudio = globalThis.Audio;
    (globalThis as unknown as { Audio: typeof Audio }).Audio = vi.fn(() => {
      const element = new MockAudioElement();
      mockAudioElements.push(element);
      return element;
    }) as unknown as typeof Audio;

    // Mock MediaSession
    mockMediaSession = {
      metadata: null,
      playbackState: 'none',
      setActionHandler: vi.fn(),
    };
    Object.defineProperty(navigator, 'mediaSession', {
      value: mockMediaSession,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    resetMeditationAudio();
    globalThis.Audio = originalAudio;
  });

  describe('initMeditationAudio', () => {
    it('should create audio elements on first call', () => {
      initMeditationAudio();

      // narration, bell, keepalive = 3 elements
      expect(mockAudioElements).toHaveLength(3);
      expect(isMeditationAudioInitialized()).toBe(true);
    });

    it('should be idempotent', () => {
      initMeditationAudio();
      initMeditationAudio();
      initMeditationAudio();

      expect(mockAudioElements).toHaveLength(3);
    });

    it('should set up MediaSession handlers', () => {
      initMeditationAudio();

      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith(
        'pause',
        expect.any(Function)
      );
      expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      );
    });

    it('should not set up nexttrack handler (meditation has no skip)', () => {
      initMeditationAudio();

      const calls = mockMediaSession.setActionHandler.mock.calls as [
        string,
        (() => void) | null,
      ][];
      const nexttrackCall = calls.find((call) => call[0] === 'nexttrack');

      expect(nexttrackCall).toBeUndefined();
    });
  });

  describe('playMeditationNarration', () => {
    it('should throw if not initialized', async () => {
      await expect(
        playMeditationNarration('sessions/basic-breathing/intro.wav')
      ).rejects.toThrow('Audio not initialized');
    });

    it('should play audio and resolve when ended', async () => {
      initMeditationAudio();
      expect(mockAudioElements[0]).toBeDefined();
      const narrationAudio = mockAudioElements[0] as MockAudioElement;

      const playPromise = playMeditationNarration(
        'sessions/basic-breathing/intro-welcome.wav'
      );

      // Simulate audio ended
      setTimeout(() => {
        narrationAudio.onended?.();
      }, 10);

      await playPromise;

      expect(narrationAudio.src).toBe(
        '/audio/meditation/sessions/basic-breathing/intro-welcome.wav'
      );
      expect(narrationAudio.load).toHaveBeenCalled();
      expect(narrationAudio.play).toHaveBeenCalled();
    });

    it('should reject with MeditationAudioPlaybackError on load failure', async () => {
      initMeditationAudio();
      expect(mockAudioElements[0]).toBeDefined();
      const narrationAudio = mockAudioElements[0] as MockAudioElement;

      const playPromise = playMeditationNarration('missing.wav');

      // Simulate error
      setTimeout(() => {
        narrationAudio.onerror?.();
      }, 10);

      await expect(playPromise).rejects.toThrow(MeditationAudioPlaybackError);
    });

    it('should pause keepalive during playback', async () => {
      initMeditationAudio();
      expect(mockAudioElements[0]).toBeDefined();
      expect(mockAudioElements[2]).toBeDefined();
      const narrationAudio = mockAudioElements[0] as MockAudioElement;
      const keepaliveAudio = mockAudioElements[2] as MockAudioElement;

      // Start keepalive first
      startMeditationKeepalive();

      // Wait for the play promise to resolve
      await vi.waitFor(() => {
        expect(isMeditationKeepaliveActive()).toBe(true);
      });

      const playPromise = playMeditationNarration('test.wav');

      expect(keepaliveAudio.pause).toHaveBeenCalled();

      // Simulate ended
      setTimeout(() => {
        narrationAudio.onended?.();
      }, 10);

      await playPromise;
    });
  });

  describe('playMeditationBell', () => {
    it('should throw if not initialized', async () => {
      await expect(playMeditationBell()).rejects.toThrow('Audio not initialized');
    });

    it('should play bell sound and resolve when ended', async () => {
      initMeditationAudio();
      expect(mockAudioElements[1]).toBeDefined();
      const bellAudio = mockAudioElements[1] as MockAudioElement;

      const playPromise = playMeditationBell();

      // Simulate audio ended
      setTimeout(() => {
        bellAudio.onended?.();
      }, 10);

      await playPromise;

      expect(bellAudio.src).toBe('/audio/meditation/shared/bell.wav');
      expect(bellAudio.load).toHaveBeenCalled();
      expect(bellAudio.play).toHaveBeenCalled();
    });

    it('should reject on bell playback failure', async () => {
      initMeditationAudio();
      expect(mockAudioElements[1]).toBeDefined();
      const bellAudio = mockAudioElements[1] as MockAudioElement;

      const playPromise = playMeditationBell();

      // Simulate error
      setTimeout(() => {
        bellAudio.onerror?.();
      }, 10);

      await expect(playPromise).rejects.toThrow(MeditationAudioPlaybackError);
    });
  });

  describe('keepalive', () => {
    it('should start keepalive loop', () => {
      initMeditationAudio();
      expect(mockAudioElements[2]).toBeDefined();
      const keepaliveAudio = mockAudioElements[2] as MockAudioElement;

      startMeditationKeepalive();

      expect(keepaliveAudio.src).toBe('/audio/meditation/shared/silence-1s.wav');
      expect(keepaliveAudio.play).toHaveBeenCalled();
    });

    it('should stop keepalive', () => {
      initMeditationAudio();
      expect(mockAudioElements[2]).toBeDefined();
      const keepaliveAudio = mockAudioElements[2] as MockAudioElement;

      startMeditationKeepalive();
      stopMeditationKeepalive();

      expect(keepaliveAudio.pause).toHaveBeenCalled();
      expect(isMeditationKeepaliveActive()).toBe(false);
    });
  });

  describe('MediaSession', () => {
    it('should update metadata', () => {
      setMeditationMediaSessionMetadata('Basic Breathing', 'Introduction');

      expect(mockMediaSession.metadata).not.toBeNull();
      expect(mockMediaSession.metadata?.title).toBe('Basic Breathing');
      expect(mockMediaSession.metadata?.artist).toBe('Introduction');
      expect(mockMediaSession.metadata?.album).toBe('Meditation');
    });

    it('should update playback state', () => {
      setMeditationMediaSessionPlaybackState('playing');
      expect(mockMediaSession.playbackState).toBe('playing');

      setMeditationMediaSessionPlaybackState('paused');
      expect(mockMediaSession.playbackState).toBe('paused');
    });

    it('should call registered callbacks', () => {
      initMeditationAudio();

      const onPause = vi.fn();
      const onPlay = vi.fn();

      setMeditationMediaSessionCallbacks({ onPause, onPlay });

      // Get the handlers that were registered
      type HandlerCall = [string, (() => void) | null];
      const calls = mockMediaSession.setActionHandler.mock.calls as HandlerCall[];
      const pauseHandler = calls.find((call) => call[0] === 'pause')?.[1];
      const playHandler = calls.find((call) => call[0] === 'play')?.[1];

      // Call the handlers
      pauseHandler?.();
      playHandler?.();

      expect(onPause).toHaveBeenCalled();
      expect(onPlay).toHaveBeenCalled();
    });
  });

  describe('stopAllMeditationAudio', () => {
    it('should stop all audio and clear media session', () => {
      initMeditationAudio();
      expect(mockAudioElements[0]).toBeDefined();
      expect(mockAudioElements[1]).toBeDefined();
      expect(mockAudioElements[2]).toBeDefined();
      const narrationAudio = mockAudioElements[0] as MockAudioElement;
      const bellAudio = mockAudioElements[1] as MockAudioElement;
      const keepaliveAudio = mockAudioElements[2] as MockAudioElement;

      setMeditationMediaSessionMetadata('Test', 'Test');
      stopAllMeditationAudio();

      expect(narrationAudio.pause).toHaveBeenCalled();
      expect(bellAudio.pause).toHaveBeenCalled();
      expect(keepaliveAudio.pause).toHaveBeenCalled();
      expect(mockMediaSession.metadata).toBeNull();
      expect(mockMediaSession.playbackState).toBe('none');
    });
  });
});
