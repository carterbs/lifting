import SwiftUI

/// Main dashboard showing today's scheduled activities
struct TodayDashboardView: View {
    @EnvironmentObject var appState: AppState

    // Placeholder state - will be replaced with actual data
    @State private var todayWorkout: Workout? = Workout.mockTodayWorkout
    @State private var lastStretchSession: StretchSession? = StretchSession.mockRecentSession
    @State private var lastMeditationSession: MeditationSession? = MeditationSession.mockRecentSession

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Today's Workout Section
                    todayWorkoutSection

                    // Quick Access Cards
                    quickAccessSection
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background)
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - Today's Workout Section

    @ViewBuilder
    private var todayWorkoutSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Today's Workout")

            if let workout = todayWorkout {
                TodayWorkoutCard(workout: workout) {
                    // Navigate to workout - placeholder
                    appState.isShowingLiftingContext = true
                }
            } else {
                noWorkoutCard
            }
        }
    }

    private var noWorkoutCard: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 32))
                .foregroundColor(Theme.success)

            Text("Rest Day")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Text("No workout scheduled for today")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.lg)
        .cardStyle()
    }

    // MARK: - Quick Access Section

    @ViewBuilder
    private var quickAccessSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Quick Access")

            // Stretch Card
            ActivityQuickCard(
                title: "Stretch",
                subtitle: formatLastSession(lastStretchSession?.completedAt),
                iconName: ActivityType.stretch.iconName,
                color: Theme.stretch
            ) {
                appState.isShowingStretch = true
            }

            // Meditation Card
            ActivityQuickCard(
                title: "Meditation",
                subtitle: formatLastSession(lastMeditationSession?.completedAt),
                iconName: ActivityType.meditation.iconName,
                color: Theme.meditation
            ) {
                appState.isShowingMeditation = true
            }

            // View History Card
            ActivityQuickCard(
                title: "View History",
                subtitle: "See all past activities",
                iconName: "calendar",
                color: Theme.accent
            ) {
                appState.selectedTab = .history
            }
        }
    }

    // MARK: - Helpers

    private func formatLastSession(_ date: Date?) -> String {
        guard let date = date else {
            return "Never"
        }

        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .short
            return formatter.localizedString(for: date, relativeTo: Date())
        }
    }
}

/// Card displaying today's scheduled workout
struct TodayWorkoutCard: View {
    let workout: Workout
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(workout.planDayName ?? "Workout")
                            .font(.headline)
                            .foregroundColor(Theme.textPrimary)

                        Text(formattedDate)
                            .font(.subheadline)
                            .foregroundColor(Theme.textSecondary)
                    }

                    Spacer()

                    StatusBadge(status: workout.status)
                }

                if let exercises = workout.exercises {
                    HStack(spacing: Theme.Spacing.lg) {
                        Label("\(exercises.count) exercises", systemImage: "dumbbell")
                        Label("\(totalSets) sets", systemImage: "number")
                    }
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
                }

                // Progress indicator
                if workout.status == .inProgress, let exercises = workout.exercises {
                    let completed = exercises.reduce(0) { $0 + $1.completedSets }
                    let total = exercises.reduce(0) { $0 + $1.totalSets }
                    ProgressView(value: Double(completed), total: Double(total))
                        .tint(Theme.accent)
                }

                HStack {
                    Spacer()
                    Text(actionText)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(Theme.accent)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(Theme.accent)
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .stroke(Theme.lifting.opacity(0.5), lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: workout.scheduledDate)
    }

    private var totalSets: Int {
        workout.exercises?.reduce(0) { $0 + $1.totalSets } ?? 0
    }

    private var actionText: String {
        switch workout.status {
        case .pending: return "Start Workout"
        case .inProgress: return "Continue Workout"
        case .completed: return "View Details"
        case .skipped: return "View Details"
        }
    }
}

#Preview {
    TodayDashboardView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
