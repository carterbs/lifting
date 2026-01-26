import SwiftUI

/// Stretch session states
enum StretchSessionState {
    case setup
    case active
    case complete
}

/// Main stretch view managing session lifecycle
struct StretchView: View {
    @EnvironmentObject var appState: AppState

    @State private var sessionState: StretchSessionState = .setup
    @State private var config: StretchSessionConfig = .defaultConfig
    @State private var completedSession: StretchSession?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background
                    .ignoresSafeArea()

                switch sessionState {
                case .setup:
                    StretchSetupView(
                        config: $config,
                        onStart: startSession
                    )

                case .active:
                    StretchActiveView(
                        config: config,
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
                        StretchCompleteView(
                            session: session,
                            onDone: {
                                appState.isShowingStretch = false
                            },
                            onStartAnother: {
                                sessionState = .setup
                            }
                        )
                    }
                }
            }
            .navigationTitle("Stretch")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if sessionState == .setup {
                        Button(action: {
                            appState.isShowingStretch = false
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

/// Setup view for configuring stretch session
struct StretchSetupView: View {
    @Binding var config: StretchSessionConfig
    let onStart: () -> Void

    @State private var spotifyUrl: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                // Region Selection
                regionSelectionSection

                // Duration Selection
                durationSection

                // Spotify Integration
                spotifySection

                // Start Button
                startButton
            }
            .padding(Theme.Spacing.md)
        }
    }

    // MARK: - Region Selection

    @ViewBuilder
    private var regionSelectionSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            HStack {
                SectionHeader(title: "Body Regions")

                Spacer()

                Button(action: toggleAll) {
                    Text(allSelected ? "Deselect All" : "Select All")
                        .font(.caption)
                        .foregroundColor(Theme.accent)
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Theme.Spacing.sm) {
                ForEach(config.regions.indices, id: \.self) { index in
                    RegionToggleCard(
                        region: config.regions[index].region,
                        isEnabled: config.regions[index].enabled,
                        onToggle: {
                            config.regions[index].enabled.toggle()
                        }
                    )
                }
            }
        }
    }

    private var allSelected: Bool {
        config.regions.allSatisfy { $0.enabled }
    }

    private func toggleAll() {
        let newValue = !allSelected
        for index in config.regions.indices {
            config.regions[index].enabled = newValue
        }
    }

    // MARK: - Duration Section

    @ViewBuilder
    private var durationSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Duration per Region")

            HStack(spacing: Theme.Spacing.md) {
                DurationOption(
                    duration: 60,
                    isSelected: config.regions.first?.durationSeconds == 60,
                    onSelect: { setDuration(60) }
                )

                DurationOption(
                    duration: 120,
                    isSelected: config.regions.first?.durationSeconds == 120,
                    onSelect: { setDuration(120) }
                )
            }
        }
    }

    private func setDuration(_ seconds: Int) {
        for index in config.regions.indices {
            config.regions[index].durationSeconds = seconds
        }
    }

    // MARK: - Spotify Section

    @ViewBuilder
    private var spotifySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Spotify Playlist (Optional)")

            TextField("Paste Spotify playlist URL", text: $spotifyUrl)
                .textFieldStyle(.plain)
                .padding(Theme.Spacing.md)
                .background(Theme.backgroundSecondary)
                .cornerRadius(Theme.CornerRadius.md)
                .onChange(of: spotifyUrl) { _, newValue in
                    config.spotifyPlaylistUrl = newValue.isEmpty ? nil : newValue
                }

            Text("Music will open in the Spotify app when the session starts.")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
    }

    // MARK: - Start Button

    @ViewBuilder
    private var startButton: some View {
        let enabledRegions = config.regions.filter { $0.enabled }
        let totalMinutes = enabledRegions.reduce(0) { $0 + $1.durationSeconds } / 60

        VStack(spacing: Theme.Spacing.sm) {
            Button(action: onStart) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("Start Session")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(enabledRegions.isEmpty)

            Text("\(enabledRegions.count) regions • ~\(totalMinutes) minutes")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(.top, Theme.Spacing.md)
    }
}

/// Toggle card for a body region
struct RegionToggleCard: View {
    let region: BodyRegion
    let isEnabled: Bool
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: region.iconName)
                    .foregroundColor(isEnabled ? Theme.stretch : Theme.textSecondary)

                Text(region.displayName)
                    .font(.subheadline)
                    .foregroundColor(isEnabled ? Theme.textPrimary : Theme.textSecondary)

                Spacer()

                Image(systemName: isEnabled ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isEnabled ? Theme.stretch : Theme.textSecondary)
            }
            .padding(Theme.Spacing.md)
            .background(isEnabled ? Theme.stretch.opacity(0.1) : Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .stroke(isEnabled ? Theme.stretch : Theme.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Duration option button
struct DurationOption: View {
    let duration: Int
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 4) {
                Text("\(duration / 60)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(isSelected ? Theme.stretch : Theme.textPrimary)

                Text(duration == 60 ? "minute" : "minutes")
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.md)
            .background(isSelected ? Theme.stretch.opacity(0.1) : Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .stroke(isSelected ? Theme.stretch : Theme.border, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Active stretch session view
struct StretchActiveView: View {
    let config: StretchSessionConfig
    let onComplete: (StretchSession) -> Void
    let onCancel: () -> Void

    @State private var currentRegionIndex: Int = 0
    @State private var timeRemaining: Int = 0
    @State private var isPaused: Bool = false
    @State private var skippedRegions: Set<Int> = []
    @State private var sessionStartTime: Date = Date()

    private var enabledRegions: [StretchRegionConfig] {
        config.regions.filter { $0.enabled }
    }

    private var currentRegion: StretchRegionConfig? {
        guard currentRegionIndex < enabledRegions.count else { return nil }
        return enabledRegions[currentRegionIndex]
    }

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Progress indicator
            progressSection

            // Current stretch display
            if let region = currentRegion {
                currentStretchSection(region)
            }

            // Timer
            timerSection

            Spacer()

            // Controls
            controlsSection
        }
        .padding(Theme.Spacing.md)
        .onAppear {
            if let region = currentRegion {
                timeRemaining = region.durationSeconds
            }
            startTimer()
        }
    }

    // MARK: - Progress Section

    @ViewBuilder
    private var progressSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text("Region \(currentRegionIndex + 1) of \(enabledRegions.count)")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)

            // Progress dots
            HStack(spacing: Theme.Spacing.xs) {
                ForEach(0..<enabledRegions.count, id: \.self) { index in
                    Circle()
                        .fill(dotColor(for: index))
                        .frame(width: 8, height: 8)
                }
            }
        }
    }

    private func dotColor(for index: Int) -> Color {
        if index < currentRegionIndex {
            return skippedRegions.contains(index) ? Theme.statusSkipped : Theme.stretch
        } else if index == currentRegionIndex {
            return Theme.stretch
        } else {
            return Theme.backgroundTertiary
        }
    }

    // MARK: - Current Stretch Section

    @ViewBuilder
    private func currentStretchSection(_ region: StretchRegionConfig) -> some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: region.region.iconName)
                .font(.system(size: 60))
                .foregroundColor(Theme.stretch)

            Text(region.region.displayName)
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)

            Text("Hold the stretch and breathe deeply")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
        }
    }

    // MARK: - Timer Section

    @ViewBuilder
    private var timerSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(formattedTime)
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundColor(Theme.textPrimary)
                .monospacedDigit()

            if isPaused {
                Text("PAUSED")
                    .font(.headline)
                    .foregroundColor(Theme.warning)
            }
        }
    }

    private var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    // MARK: - Controls Section

    @ViewBuilder
    private var controlsSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            HStack(spacing: Theme.Spacing.lg) {
                // Skip button
                Button(action: skipRegion) {
                    VStack {
                        Image(systemName: "forward.fill")
                            .font(.title2)
                        Text("Skip")
                            .font(.caption)
                    }
                    .foregroundColor(Theme.textSecondary)
                }

                // Pause/Resume button
                Button(action: togglePause) {
                    ZStack {
                        Circle()
                            .fill(Theme.stretch)
                            .frame(width: 80, height: 80)

                        Image(systemName: isPaused ? "play.fill" : "pause.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }

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
            }
        }
    }

    // MARK: - Actions

    private func startTimer() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            guard !isPaused else { return }

            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                // Move to next region
                if currentRegionIndex < enabledRegions.count - 1 {
                    currentRegionIndex += 1
                    if let region = currentRegion {
                        timeRemaining = region.durationSeconds
                    }
                } else {
                    timer.invalidate()
                    completeSession()
                }
            }
        }
    }

    private func togglePause() {
        isPaused.toggle()
    }

    private func skipRegion() {
        skippedRegions.insert(currentRegionIndex)

        if currentRegionIndex < enabledRegions.count - 1 {
            currentRegionIndex += 1
            if let region = currentRegion {
                timeRemaining = region.durationSeconds
            }
        } else {
            completeSession()
        }
    }

    private func endSession() {
        completeSession()
    }

    private func completeSession() {
        let totalDuration = Int(Date().timeIntervalSince(sessionStartTime))
        let session = StretchSession(
            id: UUID().uuidString,
            completedAt: Date(),
            totalDurationSeconds: totalDuration,
            regionsCompleted: enabledRegions.count - skippedRegions.count,
            regionsSkipped: skippedRegions.count,
            stretches: nil
        )
        onComplete(session)
    }
}

/// Stretch session completion view
struct StretchCompleteView: View {
    let session: StretchSession
    let onDone: () -> Void
    let onStartAnother: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Success icon
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(Theme.stretch)

            Text("Great Stretch!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)

            // Stats
            VStack(spacing: Theme.Spacing.md) {
                StatRow(label: "Duration", value: session.formattedDuration)
                StatRow(label: "Regions Completed", value: "\(session.regionsCompleted)")
                if session.regionsSkipped > 0 {
                    StatRow(label: "Regions Skipped", value: "\(session.regionsSkipped)")
                }
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

/// Simple stat row for completion view
struct StatRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(Theme.textSecondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
                .foregroundColor(Theme.textPrimary)
        }
    }
}

#Preview {
    StretchView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
