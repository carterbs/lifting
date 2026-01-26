import SwiftUI

/// User profile and settings view
struct ProfileView: View {
    // Placeholder stats - will be replaced with actual data
    @State private var mesocyclesCompleted: Int = 3
    @State private var totalMesocycles: Int = 4
    @State private var totalMeditationSessions: Int = 47
    @State private var totalMeditationMinutes: Int = 520
    @State private var notificationsEnabled: Bool = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Stats Section
                    statsSection

                    // Settings Section
                    settingsSection

                    // About Section
                    aboutSection
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background)
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - Stats Section

    @ViewBuilder
    private var statsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Statistics")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Theme.Spacing.md) {
                StatCard(
                    title: "Mesocycles",
                    value: "\(mesocyclesCompleted)",
                    subtitle: "completed",
                    iconName: "trophy.fill",
                    color: Theme.lifting
                )

                StatCard(
                    title: "Total Mesos",
                    value: "\(totalMesocycles)",
                    subtitle: "all time",
                    iconName: "chart.bar.fill",
                    color: Theme.accent
                )

                StatCard(
                    title: "Meditations",
                    value: "\(totalMeditationSessions)",
                    subtitle: "sessions",
                    iconName: "brain.head.profile",
                    color: Theme.meditation
                )

                StatCard(
                    title: "Meditation",
                    value: "\(totalMeditationMinutes)",
                    subtitle: "minutes",
                    iconName: "clock.fill",
                    color: Theme.meditation
                )
            }
        }
    }

    // MARK: - Settings Section

    @ViewBuilder
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Settings")

            VStack(spacing: 0) {
                // Notifications Toggle
                SettingsRow(
                    title: "Notifications",
                    subtitle: "Rest timer and workout reminders",
                    iconName: "bell.fill",
                    iconColor: Theme.warning
                ) {
                    Toggle("", isOn: $notificationsEnabled)
                        .tint(Theme.accent)
                }

                Divider()
                    .background(Theme.border)

                // Data Management
                SettingsRow(
                    title: "Export Data",
                    subtitle: "Download your workout history",
                    iconName: "square.and.arrow.up.fill",
                    iconColor: Theme.accent
                ) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Theme.textSecondary)
                }

                Divider()
                    .background(Theme.border)

                // Clear Data (destructive)
                SettingsRow(
                    title: "Clear All Data",
                    subtitle: "This cannot be undone",
                    iconName: "trash.fill",
                    iconColor: Theme.error
                ) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Theme.textSecondary)
                }
            }
            .background(Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
        }
    }

    // MARK: - About Section

    @ViewBuilder
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "About")

            VStack(spacing: 0) {
                SettingsRow(
                    title: "Version",
                    subtitle: nil,
                    iconName: "info.circle.fill",
                    iconColor: Theme.textSecondary
                ) {
                    Text("1.0.0")
                        .font(.subheadline)
                        .foregroundColor(Theme.textSecondary)
                }

                Divider()
                    .background(Theme.border)

                SettingsRow(
                    title: "Privacy Policy",
                    subtitle: nil,
                    iconName: "lock.fill",
                    iconColor: Theme.textSecondary
                ) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Theme.textSecondary)
                }

                Divider()
                    .background(Theme.border)

                SettingsRow(
                    title: "Terms of Service",
                    subtitle: nil,
                    iconName: "doc.text.fill",
                    iconColor: Theme.textSecondary
                ) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(Theme.textSecondary)
                }
            }
            .background(Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
        }
    }
}

/// Card displaying a statistic
struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let iconName: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Image(systemName: iconName)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(Theme.textPrimary)

            Text(subtitle)
                .font(.caption)
                .foregroundColor(Theme.textSecondary)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                .stroke(Theme.border, lineWidth: 1)
        )
    }
}

/// Row in settings list
struct SettingsRow<Accessory: View>: View {
    let title: String
    let subtitle: String?
    let iconName: String
    let iconColor: Color
    @ViewBuilder let accessory: () -> Accessory

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            Image(systemName: iconName)
                .foregroundColor(iconColor)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(Theme.textPrimary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }
            }

            Spacer()

            accessory()
        }
        .padding(Theme.Spacing.md)
    }
}

#Preview {
    ProfileView()
        .preferredColorScheme(.dark)
}
