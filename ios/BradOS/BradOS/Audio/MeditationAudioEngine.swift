import AVFoundation
import Combine

/// Audio engine for meditation playback managing narration, bell, and keepalive
final class MeditationAudioEngine: NSObject, ObservableObject {
    static let shared = MeditationAudioEngine()

    // MARK: - Published State

    @Published var isPlaying: Bool = false
    @Published var audioError: Error?

    // MARK: - Audio Players

    private var narrationPlayer: AVAudioPlayer?
    private var bellPlayer: AVAudioPlayer?
    private var keepalivePlayer: AVAudioPlayer?

    // MARK: - State

    private var isInitialized = false
    private let audioSession = AudioSessionManager.shared

    // MARK: - Initialization

    override init() {
        super.init()
        setupInterruptionHandler()
    }

    private func setupInterruptionHandler() {
        audioSession.onInterruption = { [weak self] type in
            switch type {
            case .began:
                self?.isPlaying = false
            case .ended:
                // Will be handled by the view to resume if needed
                break
            @unknown default:
                break
            }
        }
    }

    /// Initialize the audio engine (call during user gesture to ensure audio works)
    func initialize() async throws {
        guard !isInitialized else { return }

        // Activate audio session
        try audioSession.activate()

        // Pre-load bell sound for quick playback
        if let bellURL = getAudioURL(for: "shared/bell.wav") {
            bellPlayer = try AVAudioPlayer(contentsOf: bellURL)
            bellPlayer?.prepareToPlay()
        }

        // Setup keepalive with silence
        try setupKeepalive()

        isInitialized = true
    }

    // MARK: - Audio File Resolution

    /// Get URL for an audio file, checking bundle first
    /// Paths come from manifest like "sessions/basic-breathing/intro-welcome.wav" or "shared/bell.wav"
    /// Files are stored in Audio/meditation/...
    private func getAudioURL(for path: String) -> URL? {
        let components = path.components(separatedBy: "/")
        let filename = components.last ?? path
        let filenameWithoutExt = (filename as NSString).deletingPathExtension
        let ext = (filename as NSString).pathExtension.isEmpty ? "wav" : (filename as NSString).pathExtension

        // Build subdirectory path: Audio/meditation/{folder}
        let folder = components.count > 1 ? components.dropLast().joined(separator: "/") : ""
        let subdirectory = folder.isEmpty ? "Audio/meditation" : "Audio/meditation/\(folder)"

        // Try in the expected location
        if let url = Bundle.main.url(
            forResource: filenameWithoutExt,
            withExtension: ext,
            subdirectory: subdirectory
        ) {
            #if DEBUG
            print("[MeditationAudioEngine] Found audio: \(path) at \(url.path)")
            #endif
            return url
        }

        // Fallback: Try just the filename anywhere in bundle
        if let url = Bundle.main.url(forResource: filenameWithoutExt, withExtension: ext) {
            #if DEBUG
            print("[MeditationAudioEngine] Found audio (fallback): \(path) at \(url.path)")
            #endif
            return url
        }

        #if DEBUG
        print("[MeditationAudioEngine] Audio file not found: \(path) (looked in \(subdirectory))")
        #endif
        return nil
    }

    // MARK: - Narration Playback

    /// Play a narration audio file
    func playNarration(file: String) async throws {
        stopNarration()

        guard let url = getAudioURL(for: file) else {
            // Audio file not available - this is expected until API phase
            // In production, this would trigger a download
            print("Audio file not found: \(file)")
            return
        }

        do {
            narrationPlayer = try AVAudioPlayer(contentsOf: url)
            narrationPlayer?.delegate = self
            narrationPlayer?.prepareToPlay()
            narrationPlayer?.play()
            isPlaying = true
        } catch {
            audioError = error
            throw error
        }
    }

    /// Stop any playing narration
    func stopNarration() {
        narrationPlayer?.stop()
        narrationPlayer = nil
    }

    // MARK: - Bell Sound

    /// Play the meditation bell
    func playBell() async throws {
        guard let player = bellPlayer else {
            // Try to load bell if not already loaded
            if let bellURL = getAudioURL(for: "shared/bell.wav") {
                bellPlayer = try AVAudioPlayer(contentsOf: bellURL)
                bellPlayer?.prepareToPlay()
            } else {
                print("Bell sound not available")
                return
            }
            return try await playBell()
        }

        player.currentTime = 0
        player.play()
    }

    // MARK: - Keepalive

    /// Setup the keepalive player with silent audio
    private func setupKeepalive() throws {
        // Try to find silence file in bundle
        if let silenceURL = getAudioURL(for: "shared/silence.wav") {
            keepalivePlayer = try AVAudioPlayer(contentsOf: silenceURL)
            keepalivePlayer?.numberOfLoops = -1  // Loop indefinitely
            keepalivePlayer?.volume = 0.01  // Nearly silent but enough to keep session alive
            keepalivePlayer?.prepareToPlay()
        } else {
            // Generate silence programmatically if no file available
            try generateSilentKeepalive()
        }
    }

    /// Generate a silent audio buffer for keepalive
    private func generateSilentKeepalive() throws {
        // Create a 1-second silent audio buffer
        let sampleRate: Double = 44100
        let duration: Double = 1.0
        let numSamples = Int(sampleRate * duration)

        var audioFormat = AudioStreamBasicDescription(
            mSampleRate: sampleRate,
            mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked,
            mBytesPerPacket: 4,
            mFramesPerPacket: 1,
            mBytesPerFrame: 4,
            mChannelsPerFrame: 1,
            mBitsPerChannel: 32,
            mReserved: 0
        )

        // Create silent audio data
        var silence = [Float](repeating: 0.0, count: numSamples)

        // Write to temporary file
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("silence.wav")

        // For simplicity, we'll just set keepalive to nil if we can't create it
        // The app will still work but background audio might stop
        keepalivePlayer = nil
    }

    /// Start the keepalive loop for background playback
    func startKeepalive() {
        keepalivePlayer?.play()
    }

    /// Stop the keepalive loop
    func stopKeepalive() {
        keepalivePlayer?.stop()
    }

    // MARK: - Pause/Resume

    /// Pause all audio playback
    func pause() {
        narrationPlayer?.pause()
        keepalivePlayer?.pause()
        isPlaying = false
    }

    /// Resume audio playback
    func resume() {
        keepalivePlayer?.play()
        // Don't resume narration - let the cue scheduler handle it
        isPlaying = true
    }

    // MARK: - Cleanup

    /// Teardown the audio engine
    func teardown() {
        stopNarration()
        stopKeepalive()
        bellPlayer?.stop()
        audioSession.deactivate()
        isInitialized = false
        isPlaying = false
    }

    /// Stop all audio immediately (for early session end)
    func stopAll() {
        narrationPlayer?.stop()
        bellPlayer?.stop()
        keepalivePlayer?.stop()
        isPlaying = false
    }
}

// MARK: - AVAudioPlayerDelegate

extension MeditationAudioEngine: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if player === narrationPlayer {
            // Narration finished
            DispatchQueue.main.async {
                self.narrationPlayer = nil
            }
        }
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        if let error = error {
            DispatchQueue.main.async {
                self.audioError = error
            }
        }
    }
}
