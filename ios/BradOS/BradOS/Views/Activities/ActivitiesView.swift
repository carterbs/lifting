import SwiftUI

/// Grid view of available activity types
struct ActivitiesView: View {
    @EnvironmentObject var appState: AppState

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Activity Cards Grid
                    LazyVGrid(columns: columns, spacing: Theme.Spacing.md) {
                        // Lifting - Full width
                        ActivityCard(activityType: .workout) {
                            appState.isShowingLiftingContext = true
                        }
                        .gridCellColumns(2)

                        // Stretch
                        ActivityCard(activityType: .stretch) {
                            appState.isShowingStretch = true
                        }

                        // Meditation
                        ActivityCard(activityType: .meditation) {
                            appState.isShowingMeditation = true
                        }
                    }

                    // Recent Activity Section
                    recentActivitySection
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background)
            .navigationTitle("Activities")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - Recent Activity Section

    @ViewBuilder
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Recent Activity", actionTitle: "See All") {
                appState.selectedTab = .history
            }

            // Placeholder recent activities
            ForEach(CalendarActivity.mockActivities.prefix(3)) { activity in
                RecentActivityRow(activity: activity)
            }
        }
    }
}

/// Row displaying a recent activity
struct RecentActivityRow: View {
    let activity: CalendarActivity

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            // Activity type icon
            Image(systemName: activity.type.iconName)
                .font(.system(size: 20))
                .foregroundColor(activity.type.color)
                .frame(width: 36, height: 36)
                .background(activity.type.color.opacity(0.2))
                .cornerRadius(Theme.CornerRadius.sm)

            VStack(alignment: .leading, spacing: 2) {
                Text(activityTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(Theme.textPrimary)

                Text(activitySubtitle)
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }

            Spacer()

            Text(formattedDate)
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
    }

    private var activityTitle: String {
        switch activity.type {
        case .workout:
            return activity.summary.dayName ?? "Workout"
        case .stretch:
            return "Stretch Session"
        case .meditation:
            return "Meditation"
        }
    }

    private var activitySubtitle: String {
        switch activity.type {
        case .workout:
            if let sets = activity.summary.setsCompleted, let total = activity.summary.totalSets {
                return "\(sets)/\(total) sets completed"
            }
            return ""
        case .stretch:
            if let completed = activity.summary.regionsCompleted {
                return "\(completed) regions"
            }
            return ""
        case .meditation:
            if let duration = activity.summary.durationSeconds {
                return "\(duration / 60) minutes"
            }
            return ""
        }
    }

    private var formattedDate: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(activity.date) {
            return "Today"
        } else if calendar.isDateInYesterday(activity.date) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return formatter.string(from: activity.date)
        }
    }
}

#Preview {
    ActivitiesView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
