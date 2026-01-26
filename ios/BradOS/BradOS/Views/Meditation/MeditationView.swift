import SwiftUI

/// Meditation session states
enum MeditationSessionState {
    case setup
    case active
    case complete
}

/// Breathing phase for meditation
enum BreathingPhase: String {
    case inhale = "Inhale"
    case hold = "Hold"
    case exhale = "Exhale"

    var duration: Double {
        switch self {
        case .inhale: return 4.0
        case .hold: return 4.0
        case .exhale: return 4.0
        }
    }
}

/// Main meditation view managing session lifecycle
struct MeditationView: View {
    @EnvironmentObject var appState: AppState

    @State private var sessionState: MeditationSessionState = .setup
    @State private var selectedDuration: MeditationDuration = .five
    @State private var completedSession: MeditationSession?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background
                    .ignoresSafeArea()

                switch sessionState {
                case .setup:
                    MeditationSetupView(
                        selectedDuration: $selectedDuration,
                        onStart: startSession
                    )

                case .active:
                    MeditationActiveView(
                        duration: selectedDuration,
                        onComplete: { session in
                            completedSession = session
                            sessionState = .complete
                        },
                        onCancel: {
                            sessionState = .setup
                        }
                    )

                case .complete:
                    if let session = completedSession {
                        MeditationCompleteView(
                            session: session,
                            onDone: {
                                appState.isShowingMeditation = false
                            },
                            onStartAnother: {
                                sessionState = .setup
                            }
                        )
                    }
                }
            }
            .navigationTitle("Meditation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if sessionState == .setup {
                        Button(action: {
                            appState.isShowingMeditation = false
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                            .foregroundColor(Theme.accent)
                        }
                    }
                }
            }
        }
    }

    private func startSession() {
        sessionState = .active
    }
}

/// Setup view for configuring meditation session
struct MeditationSetupView: View {
    @Binding var selectedDuration: MeditationDuration
    let onStart: () -> Void

    // Placeholder last session
    @State private var lastSession: MeditationSession? = MeditationSession.mockRecentSession

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Icon
            Image(systemName: "brain.head.profile")
                .font(.system(size: 60))
                .foregroundColor(Theme.meditation)

            Text("Mindful Breathing")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)

            Text("Focus on your breath to calm your mind")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            Spacer()

            // Duration Selection
            durationSelectionSection

            // Last Session Info
            if let lastSession = lastSession {
                lastSessionSection(lastSession)
            }

            Spacer()

            // Start Button
            Button(action: onStart) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("Begin Session")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(Theme.Spacing.md)
    }

    // MARK: - Duration Selection

    @ViewBuilder
    private var durationSelectionSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Duration")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(Theme.textSecondary)

            HStack(spacing: Theme.Spacing.md) {
                ForEach(MeditationDuration.allCases) { duration in
                    MeditationDurationOption(
                        duration: duration,
                        isSelected: selectedDuration == duration,
                        onSelect: { selectedDuration = duration }
                    )
                }
            }
        }
    }

    // MARK: - Last Session

    @ViewBuilder
    private func lastSessionSection(_ session: MeditationSession) -> some View {
        HStack {
            Image(systemName: "clock")
                .foregroundColor(Theme.textSecondary)

            Text("Last session: \(formattedDate(session.completedAt))")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

/// Duration option button for meditation
struct MeditationDurationOption: View {
    let duration: MeditationDuration
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 4) {
                Text("\(duration.rawValue)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(isSelected ? Theme.meditation : Theme.textPrimary)

                Text("min")
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.md)
            .background(isSelected ? Theme.meditation.opacity(0.1) : Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .stroke(isSelected ? Theme.meditation : Theme.border, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Active meditation session view
struct MeditationActiveView: View {
    let duration: MeditationDuration
    let onComplete: (MeditationSession) -> Void
    let onCancel: () -> Void

    @State private var timeRemaining: Int
    @State private var isPaused: Bool = false
    @State private var breathingPhase: BreathingPhase = .inhale
    @State private var breathingProgress: Double = 0
    @State private var sessionStartTime: Date = Date()

    init(duration: MeditationDuration, onComplete: @escaping (MeditationSession) -> Void, onCancel: @escaping () -> Void) {
        self.duration = duration
        self.onComplete = onComplete
        self.onCancel = onCancel
        self._timeRemaining = State(initialValue: duration.seconds)
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Timer
            timerSection

            // Breathing Animation
            breathingSection

            // Phase indicator
            phaseSection

            Spacer()

            // Controls
            controlsSection
        }
        .padding(Theme.Spacing.md)
        .onAppear {
            startTimer()
            startBreathingCycle()
        }
    }

    // MARK: - Timer Section

    @ViewBuilder
    private var timerSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(formattedTime)
                .font(.system(size: 48, weight: .light, design: .rounded))
                .foregroundColor(Theme.textPrimary)
                .monospacedDigit()

            Text("remaining")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
    }

    private var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    // MARK: - Breathing Section

    @ViewBuilder
    private var breathingSection: some View {
        ZStack {
            // Outer ring
            Circle()
                .stroke(Theme.meditation.opacity(0.2), lineWidth: 4)
                .frame(width: 200, height: 200)

            // Animated inner circle
            Circle()
                .fill(Theme.meditation.opacity(0.3))
                .frame(width: breathingCircleSize, height: breathingCircleSize)
                .animation(.easeInOut(duration: breathingPhase.duration), value: breathingProgress)

            // Center dot
            Circle()
                .fill(Theme.meditation)
                .frame(width: 20, height: 20)
        }
    }

    private var breathingCircleSize: CGFloat {
        switch breathingPhase {
        case .inhale:
            return 80 + (120 * breathingProgress)
        case .hold:
            return 200
        case .exhale:
            return 200 - (120 * breathingProgress)
        }
    }

    // MARK: - Phase Section

    @ViewBuilder
    private var phaseSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(breathingPhase.rawValue)
                .font(.title2)
                .fontWeight(.medium)
                .foregroundColor(Theme.meditation)

            if isPaused {
                Text("PAUSED")
                    .font(.headline)
                    .foregroundColor(Theme.warning)
            }
        }
    }

    // MARK: - Controls Section

    @ViewBuilder
    private var controlsSection: some View {
        HStack(spacing: Theme.Spacing.xl) {
            // End button
            Button(action: endSession) {
                VStack {
                    Image(systemName: "stop.fill")
                        .font(.title2)
                    Text("End")
                        .font(.caption)
                }
                .foregroundColor(Theme.textSecondary)
            }

            // Pause/Resume button
            Button(action: togglePause) {
                ZStack {
                    Circle()
                        .fill(Theme.meditation)
                        .frame(width: 80, height: 80)

                    Image(systemName: isPaused ? "play.fill" : "pause.fill")
                        .font(.title)
                        .foregroundColor(.white)
                }
            }

            // Placeholder for symmetry
            Color.clear
                .frame(width: 60, height: 60)
        }
    }

    // MARK: - Timer Logic

    private func startTimer() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            guard !isPaused else { return }

            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                timer.invalidate()
                completeSession(fully: true)
            }
        }
    }

    private func startBreathingCycle() {
        func runPhase(_ phase: BreathingPhase) {
            guard !isPaused else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    runPhase(phase)
                }
                return
            }

            breathingPhase = phase
            breathingProgress = 0

            withAnimation(.linear(duration: phase.duration)) {
                breathingProgress = 1
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + phase.duration) {
                if timeRemaining > 0 {
                    let nextPhase: BreathingPhase
                    switch phase {
                    case .inhale: nextPhase = .hold
                    case .hold: nextPhase = .exhale
                    case .exhale: nextPhase = .inhale
                    }
                    runPhase(nextPhase)
                }
            }
        }

        runPhase(.inhale)
    }

    private func togglePause() {
        isPaused.toggle()
    }

    private func endSession() {
        completeSession(fully: false)
    }

    private func completeSession(fully: Bool) {
        let actualDuration = Int(Date().timeIntervalSince(sessionStartTime))
        let session = MeditationSession(
            id: UUID().uuidString,
            completedAt: Date(),
            sessionType: "basic-breathing",
            plannedDurationSeconds: duration.seconds,
            actualDurationSeconds: actualDuration,
            completedFully: fully
        )
        onComplete(session)
    }
}

/// Meditation session completion view
struct MeditationCompleteView: View {
    let session: MeditationSession
    let onDone: () -> Void
    let onStartAnother: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Success icon
            Image(systemName: session.completedFully ? "checkmark.circle.fill" : "clock.badge.checkmark.fill")
                .font(.system(size: 80))
                .foregroundColor(Theme.meditation)

            Text(session.completedFully ? "Well Done!" : "Session Ended")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)

            Text(session.completedFully
                 ? "You completed your meditation session."
                 : "You meditated for \(session.formattedActualDuration).")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            // Stats
            VStack(spacing: Theme.Spacing.md) {
                StatRow(label: "Planned Duration", value: session.formattedPlannedDuration)
                StatRow(label: "Actual Duration", value: session.formattedActualDuration)
                StatRow(label: "Completed", value: session.completedFully ? "Yes" : "Ended Early")
            }
            .padding(Theme.Spacing.md)
            .cardStyle()

            Spacer()

            // Actions
            VStack(spacing: Theme.Spacing.md) {
                Button(action: onDone) {
                    Text("Done")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Button(action: onStartAnother) {
                    Text("Start Another Session")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
        .padding(Theme.Spacing.md)
    }
}

#Preview {
    MeditationView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
