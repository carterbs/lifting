import SwiftUI

/// Main stretch view managing session lifecycle
struct StretchView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var sessionManager = StretchSessionManager()

    @State private var config: StretchSessionConfig = StretchConfigStorage.shared.load()
    @State private var showCancelConfirmation = false
    @State private var showRecoveryPrompt = false
    @State private var recoveryInfo: (stretchName: String, regionName: String, progress: String)?

    private let configStorage = StretchConfigStorage.shared
    private let sessionStorage = StretchSessionStorage.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background
                    .ignoresSafeArea()

                switch sessionManager.status {
                case .idle:
                    StretchSetupView(
                        config: $config,
                        onStart: startSession,
                        onConfigChange: saveConfig
                    )

                case .active, .paused:
                    StretchActiveView(
                        sessionManager: sessionManager,
                        onCancel: { showCancelConfirmation = true }
                    )

                case .complete:
                    StretchCompleteView(
                        sessionManager: sessionManager,
                        onDone: {
                            sessionStorage.clear()
                            sessionManager.reset()
                            appState.isShowingStretch = false
                        },
                        onStartAnother: {
                            sessionStorage.clear()
                            sessionManager.reset()
                        }
                    )
                }
            }
            .navigationTitle("Stretch")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if sessionManager.status == .idle {
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
            .onAppear {
                checkForRecoverableSession()
            }
            .alert("End Session?", isPresented: $showCancelConfirmation) {
                Button("Continue Stretching", role: .cancel) {}
                Button("End Session", role: .destructive) {
                    sessionStorage.clear()
                    sessionManager.endSession()
                }
            } message: {
                Text("Are you sure you want to end this stretch session?")
            }
            .alert("Resume Session?", isPresented: $showRecoveryPrompt) {
                Button("Resume", role: nil) {
                    resumeSession()
                }
                Button("Start Over", role: .destructive) {
                    sessionStorage.clear()
                }
            } message: {
                if let info = recoveryInfo {
                    Text("You have an unfinished stretch session (\(info.progress) stretches, currently on \(info.stretchName)). Would you like to resume?")
                } else {
                    Text("You have an unfinished stretch session. Would you like to resume?")
                }
            }
            .onChange(of: sessionManager.status) { _, newStatus in
                // Save state when session is active or paused
                if newStatus == .active || newStatus == .paused {
                    saveSessionState()
                }
            }
            .onChange(of: sessionManager.currentStretchIndex) { _, _ in
                if sessionManager.status == .active || sessionManager.status == .paused {
                    saveSessionState()
                }
            }
            .onChange(of: sessionManager.currentSegment) { _, _ in
                if sessionManager.status == .active || sessionManager.status == .paused {
                    saveSessionState()
                }
            }
        }
    }

    private func checkForRecoverableSession() {
        if let info = sessionStorage.getRecoveryInfo() {
            recoveryInfo = info
            showRecoveryPrompt = true
        }
    }

    private func resumeSession() {
        guard let state = sessionStorage.load() else { return }
        sessionManager.restore(from: state)
    }

    private func saveSessionState() {
        let state = sessionManager.exportState()
        sessionStorage.save(state)
    }

    private func startSession() {
        // Save config before starting
        configStorage.save(config)

        Task {
            await sessionManager.start(with: config)
        }
    }

    private func saveConfig() {
        configStorage.save(config)
    }
}

/// Setup view for configuring stretch session
struct StretchSetupView: View {
    @Binding var config: StretchSessionConfig
    let onStart: () -> Void
    var onConfigChange: (() -> Void)? = nil

    @State private var spotifyUrl: String = ""
    @State private var editMode: EditMode = .inactive

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Region Selection with reordering
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
        .onAppear {
            spotifyUrl = config.spotifyPlaylistUrl ?? ""
        }
    }

    // MARK: - Region Selection

    @ViewBuilder
    private var regionSelectionSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            HStack {
                SectionHeader(title: "Body Regions")

                Spacer()

                Button(action: {
                    editMode = editMode == .active ? .inactive : .active
                }) {
                    Text(editMode == .active ? "Done" : "Reorder")
                        .font(.caption)
                        .foregroundColor(Theme.accent)
                }

                Button(action: toggleAll) {
                    Text(allSelected ? "Deselect All" : "Select All")
                        .font(.caption)
                        .foregroundColor(Theme.accent)
                }
            }

            if editMode == .active {
                // List mode for drag-drop reordering
                reorderableRegionList
            } else {
                // Grid mode for normal viewing
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Theme.Spacing.sm) {
                    ForEach(config.regions.indices, id: \.self) { index in
                        RegionToggleCard(
                            region: config.regions[index].region,
                            isEnabled: config.regions[index].enabled,
                            durationSeconds: config.regions[index].durationSeconds,
                            onToggle: {
                                config.regions[index].enabled.toggle()
                                onConfigChange?()
                            },
                            onDurationToggle: {
                                config.regions[index].durationSeconds = config.regions[index].durationSeconds == 60 ? 120 : 60
                                onConfigChange?()
                            }
                        )
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var reorderableRegionList: some View {
        VStack(spacing: Theme.Spacing.xs) {
            ForEach(config.regions.indices, id: \.self) { index in
                ReorderableRegionRow(
                    config: $config.regions[index],
                    index: index,
                    totalCount: config.regions.count,
                    onMoveUp: {
                        if index > 0 {
                            config.regions.swapAt(index, index - 1)
                            onConfigChange?()
                        }
                    },
                    onMoveDown: {
                        if index < config.regions.count - 1 {
                            config.regions.swapAt(index, index + 1)
                            onConfigChange?()
                        }
                    }
                )
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
        onConfigChange?()
    }

    // MARK: - Duration Section

    @ViewBuilder
    private var durationSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Default Duration")

            HStack(spacing: Theme.Spacing.md) {
                DurationOption(
                    duration: 60,
                    isSelected: config.regions.first?.durationSeconds == 60,
                    onSelect: { setAllDurations(60) }
                )

                DurationOption(
                    duration: 120,
                    isSelected: config.regions.first?.durationSeconds == 120,
                    onSelect: { setAllDurations(120) }
                )
            }

            Text("Tap individual regions to set custom durations")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
    }

    private func setAllDurations(_ seconds: Int) {
        for index in config.regions.indices {
            config.regions[index].durationSeconds = seconds
        }
        onConfigChange?()
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
                .autocapitalization(.none)
                .autocorrectionDisabled()
                .onChange(of: spotifyUrl) { _, newValue in
                    config.spotifyPlaylistUrl = newValue.isEmpty ? nil : newValue
                    onConfigChange?()
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

            Text("\(enabledRegions.count) regions | ~\(totalMinutes) minutes")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(.top, Theme.Spacing.md)
    }
}

/// Toggle card for a body region with duration badge
struct RegionToggleCard: View {
    let region: BodyRegion
    let isEnabled: Bool
    let durationSeconds: Int
    let onToggle: () -> Void
    let onDurationToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: region.iconName)
                    .foregroundColor(isEnabled ? Theme.stretch : Theme.textSecondary)

                Text(region.displayName)
                    .font(.subheadline)
                    .foregroundColor(isEnabled ? Theme.textPrimary : Theme.textSecondary)

                Spacer()

                if isEnabled {
                    // Duration badge - tappable
                    Button(action: onDurationToggle) {
                        Text("\(durationSeconds / 60)m")
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Theme.stretch.opacity(0.2))
                            .cornerRadius(4)
                            .foregroundColor(Theme.stretch)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

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

/// Row for reordering regions with up/down buttons
struct ReorderableRegionRow: View {
    @Binding var config: StretchRegionConfig
    let index: Int
    let totalCount: Int
    let onMoveUp: () -> Void
    let onMoveDown: () -> Void

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            // Position indicator
            Text("\(index + 1)")
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
                .frame(width: 20)

            // Region info
            Image(systemName: config.region.iconName)
                .foregroundColor(config.enabled ? Theme.stretch : Theme.textSecondary)
                .frame(width: 24)

            Text(config.region.displayName)
                .font(.subheadline)
                .foregroundColor(config.enabled ? Theme.textPrimary : Theme.textSecondary)

            Spacer()

            // Duration badge
            Text("\(config.durationSeconds / 60)m")
                .font(.caption)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Theme.stretch.opacity(0.2))
                .cornerRadius(4)
                .foregroundColor(Theme.stretch)

            // Enabled toggle
            Button(action: { config.enabled.toggle() }) {
                Image(systemName: config.enabled ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(config.enabled ? Theme.stretch : Theme.textSecondary)
            }

            // Move buttons
            VStack(spacing: 2) {
                Button(action: onMoveUp) {
                    Image(systemName: "chevron.up")
                        .font(.caption)
                        .foregroundColor(index == 0 ? Theme.textSecondary.opacity(0.3) : Theme.textSecondary)
                }
                .disabled(index == 0)

                Button(action: onMoveDown) {
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundColor(index == totalCount - 1 ? Theme.textSecondary.opacity(0.3) : Theme.textSecondary)
                }
                .disabled(index == totalCount - 1)
            }
        }
        .padding(Theme.Spacing.sm)
        .background(config.enabled ? Theme.stretch.opacity(0.1) : Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.sm)
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
    @ObservedObject var sessionManager: StretchSessionManager
    let onCancel: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            // Progress indicator
            progressSection

            // Current stretch display
            if let stretch = sessionManager.currentStretch,
               let region = sessionManager.currentRegion {
                currentStretchSection(stretch: stretch, region: region)
            }

            // Segment indicator
            segmentIndicator

            // Timer
            timerSection

            Spacer()

            // Controls
            controlsSection
        }
        .padding(Theme.Spacing.md)
    }

    // MARK: - Progress Section

    @ViewBuilder
    private var progressSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text("Stretch \(sessionManager.currentStretchIndex + 1) of \(sessionManager.totalStretches)")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)

            // Progress dots
            HStack(spacing: Theme.Spacing.xs) {
                ForEach(0..<sessionManager.totalStretches, id: \.self) { index in
                    Circle()
                        .fill(dotColor(for: index))
                        .frame(width: 8, height: 8)
                }
            }
        }
    }

    private func dotColor(for index: Int) -> Color {
        if index < sessionManager.currentStretchIndex {
            // Completed
            let completed = sessionManager.completedStretches[safe: index]
            if let completed = completed, completed.skippedSegments == 2 {
                return Theme.statusSkipped
            }
            return Theme.stretch
        } else if index == sessionManager.currentStretchIndex {
            // Current
            return Theme.stretch
        } else {
            // Pending
            return Theme.backgroundTertiary
        }
    }

    // MARK: - Current Stretch Section

    @ViewBuilder
    private func currentStretchSection(stretch: Stretch, region: BodyRegion) -> some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: region.iconName)
                .font(.system(size: 60))
                .foregroundColor(Theme.stretch)

            Text(stretch.name)
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(Theme.textPrimary)
                .multilineTextAlignment(.center)

            Text(region.displayName)
                .font(.headline)
                .foregroundColor(Theme.stretch)

            Text(stretch.description)
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)
                .lineLimit(3)
                .padding(.horizontal)
        }
    }

    // MARK: - Segment Indicator

    @ViewBuilder
    private var segmentIndicator: some View {
        if let stretch = sessionManager.currentStretch {
            HStack(spacing: Theme.Spacing.md) {
                // Segment 1
                segmentPill(
                    number: 1,
                    label: stretch.bilateral ? "Left Side" : "First Half",
                    isActive: sessionManager.currentSegment == 1
                )

                // Segment 2
                segmentPill(
                    number: 2,
                    label: stretch.bilateral ? "Right Side" : "Second Half",
                    isActive: sessionManager.currentSegment == 2
                )
            }
        }
    }

    @ViewBuilder
    private func segmentPill(number: Int, label: String, isActive: Bool) -> some View {
        VStack(spacing: 4) {
            Text("Segment \(number)")
                .font(.caption2)
                .foregroundColor(isActive ? Theme.stretch : Theme.textSecondary)

            Text(label)
                .font(.caption)
                .fontWeight(isActive ? .semibold : .regular)
                .foregroundColor(isActive ? Theme.textPrimary : Theme.textSecondary)
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.sm)
        .background(isActive ? Theme.stretch.opacity(0.2) : Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.sm)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.CornerRadius.sm)
                .stroke(isActive ? Theme.stretch : Color.clear, lineWidth: 1)
        )
    }

    // MARK: - Timer Section

    @ViewBuilder
    private var timerSection: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Text(formattedTime)
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundColor(Theme.textPrimary)
                .monospacedDigit()

            if sessionManager.status == .paused {
                Text("PAUSED")
                    .font(.headline)
                    .foregroundColor(Theme.warning)
            }

            // Progress bar for current segment
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Theme.backgroundTertiary)

                    Capsule()
                        .fill(Theme.stretch)
                        .frame(width: geometry.size.width * progressFraction)
                }
            }
            .frame(height: 4)
            .padding(.horizontal, Theme.Spacing.xl)
        }
    }

    private var formattedTime: String {
        let totalSeconds = Int(sessionManager.segmentRemaining)
        let minutes = totalSeconds / 60
        let seconds = totalSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    private var progressFraction: Double {
        let total = sessionManager.segmentDuration
        guard total > 0 else { return 0 }
        return sessionManager.segmentElapsed / total
    }

    // MARK: - Controls Section

    @ViewBuilder
    private var controlsSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            HStack(spacing: Theme.Spacing.lg) {
                // Skip Segment button
                Button(action: { sessionManager.skipSegment() }) {
                    VStack {
                        Image(systemName: "forward.fill")
                            .font(.title2)
                        Text("Skip Segment")
                            .font(.caption)
                    }
                    .foregroundColor(Theme.textSecondary)
                }

                // Pause/Resume button
                Button(action: {
                    if sessionManager.status == .paused {
                        sessionManager.resume()
                    } else {
                        sessionManager.pause()
                    }
                }) {
                    ZStack {
                        Circle()
                            .fill(Theme.stretch)
                            .frame(width: 80, height: 80)

                        Image(systemName: sessionManager.status == .paused ? "play.fill" : "pause.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }

                // End button
                Button(action: onCancel) {
                    VStack {
                        Image(systemName: "stop.fill")
                            .font(.title2)
                        Text("End")
                            .font(.caption)
                    }
                    .foregroundColor(Theme.textSecondary)
                }
            }

            // Skip entire stretch button
            Button(action: { sessionManager.skipStretch() }) {
                Text("Skip Entire Stretch")
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }
        }
    }
}

/// Stretch session completion view
struct StretchCompleteView: View {
    @ObservedObject var sessionManager: StretchSessionManager
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
                StatRow(label: "Duration", value: formattedDuration)
                StatRow(label: "Stretches Completed", value: "\(completedCount)")
                if skippedCount > 0 {
                    StatRow(label: "Stretches Skipped", value: "\(skippedCount)")
                }
            }
            .padding(Theme.Spacing.md)
            .cardStyle()

            // Stretch breakdown
            if !sessionManager.completedStretches.isEmpty {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Text("Session Details")
                        .font(.headline)
                        .foregroundColor(Theme.textPrimary)
                        .padding(.bottom, Theme.Spacing.xs)

                    ForEach(sessionManager.completedStretches) { completed in
                        HStack {
                            Image(systemName: completed.region.iconName)
                                .foregroundColor(Theme.stretch)
                                .frame(width: 24)

                            Text(completed.stretchName)
                                .font(.subheadline)
                                .foregroundColor(Theme.textPrimary)

                            Spacer()

                            if completed.skippedSegments == 2 {
                                Text("Skipped")
                                    .font(.caption)
                                    .foregroundColor(Theme.statusSkipped)
                            } else if completed.skippedSegments == 1 {
                                Text("Partial")
                                    .font(.caption)
                                    .foregroundColor(Theme.warning)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Theme.stretch)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .padding(Theme.Spacing.md)
                .cardStyle()
            }

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

    private var formattedDuration: String {
        guard let startTime = sessionManager.sessionStartTime else {
            return "0m"
        }
        let totalSeconds = Int(Date().timeIntervalSince(startTime))
        let minutes = totalSeconds / 60
        let seconds = totalSeconds % 60
        if seconds == 0 {
            return "\(minutes)m"
        }
        return "\(minutes)m \(seconds)s"
    }

    private var completedCount: Int {
        sessionManager.completedStretches.filter { $0.skippedSegments < 2 }.count
    }

    private var skippedCount: Int {
        sessionManager.completedStretches.filter { $0.skippedSegments == 2 }.count
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

// MARK: - Array Extension

extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    StretchView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
