import SwiftUI

/// View displaying active mesocycle and history
struct MesoView: View {
    @Binding var navigationPath: NavigationPath

    // Placeholder state - will be replaced with actual data
    @State private var activeMesocycle: Mesocycle? = Mesocycle.mockActiveMesocycle
    @State private var completedMesocycles: [Mesocycle] = Mesocycle.mockCompletedMesocycles
    @State private var showingNewMesocycleSheet: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                // Active Mesocycle Section
                activeMesocycleSection

                // Completed Mesocycles Section
                if !completedMesocycles.isEmpty {
                    completedMesocyclesSection
                }
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.background)
        .navigationTitle("Mesocycle")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if activeMesocycle == nil {
                    Button(action: { showingNewMesocycleSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showingNewMesocycleSheet) {
            NewMesocycleSheet()
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Active Mesocycle Section

    @ViewBuilder
    private var activeMesocycleSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Active Mesocycle")

            if let meso = activeMesocycle {
                ActiveMesocycleCard(mesocycle: meso, navigationPath: $navigationPath)
            } else {
                noActiveMesocycleCard
            }
        }
    }

    private var noActiveMesocycleCard: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 40))
                .foregroundColor(Theme.textSecondary)

            Text("No Active Mesocycle")
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Text("Start a new mesocycle to begin tracking your progressive overload.")
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            Button(action: { showingNewMesocycleSheet = true }) {
                Text("Start Mesocycle")
                    .fontWeight(.medium)
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.top, Theme.Spacing.sm)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.lg)
        .cardStyle()
    }

    // MARK: - Completed Mesocycles Section

    @ViewBuilder
    private var completedMesocyclesSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Completed")

            ForEach(completedMesocycles) { meso in
                CompletedMesocycleCard(mesocycle: meso)
            }
        }
    }
}

/// Card displaying active mesocycle details
struct ActiveMesocycleCard: View {
    let mesocycle: Mesocycle
    @Binding var navigationPath: NavigationPath

    @State private var showingCancelAlert: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(mesocycle.planName ?? "Mesocycle")
                        .font(.headline)
                        .foregroundColor(Theme.textPrimary)

                    Text("Started \(formattedStartDate)")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }

                Spacer()

                GenericBadge(
                    text: mesocycle.isDeloadWeek ? "Deload" : "Week \(mesocycle.currentWeek)",
                    color: mesocycle.isDeloadWeek ? Theme.warning : Theme.accent
                )
            }

            // Progress
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Progress")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                    Spacer()
                    Text("\(mesocycle.completedWorkouts ?? 0)/\(mesocycle.totalWorkouts ?? 0) workouts")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }

                ProgressView(value: mesocycle.progressPercentage)
                    .tint(Theme.accent)
            }

            Divider()
                .background(Theme.border)

            // Week Overview (placeholder)
            weekOverview

            // Actions
            HStack(spacing: Theme.Spacing.md) {
                Button(action: { showingCancelAlert = true }) {
                    Text("Cancel")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SecondaryButtonStyle())

                if mesocycle.progressPercentage >= 1.0 {
                    Button(action: { /* Complete mesocycle */ }) {
                        Text("Complete")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                .stroke(Theme.lifting.opacity(0.5), lineWidth: 2)
        )
        .alert("Cancel Mesocycle?", isPresented: $showingCancelAlert) {
            Button("Keep Going", role: .cancel) {}
            Button("Cancel Mesocycle", role: .destructive) {
                // Cancel mesocycle action
            }
        } message: {
            Text("This will end your current mesocycle. Your progress will be saved but the mesocycle will be marked as cancelled.")
        }
    }

    private var formattedStartDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: mesocycle.startDate)
    }

    @ViewBuilder
    private var weekOverview: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("This Week")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(Theme.textPrimary)

            // Placeholder workout rows
            ForEach(0..<3, id: \.self) { index in
                HStack {
                    Circle()
                        .fill(index == 0 ? Theme.statusCompleted : Theme.backgroundTertiary)
                        .frame(width: 8, height: 8)

                    Text(["Push Day", "Pull Day", "Leg Day"][index])
                        .font(.subheadline)
                        .foregroundColor(Theme.textPrimary)

                    Spacer()

                    Text(index == 0 ? "Completed" : "Scheduled")
                        .font(.caption)
                        .foregroundColor(index == 0 ? Theme.success : Theme.textSecondary)

                    if index != 0 {
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }
                }
                .padding(.vertical, 4)
                .contentShape(Rectangle())
                .onTapGesture {
                    if index != 0 {
                        navigationPath.append(WorkoutDestination(workoutId: index))
                    }
                }
            }
        }
    }
}

/// Card displaying a completed mesocycle
struct CompletedMesocycleCard: View {
    let mesocycle: Mesocycle

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(mesocycle.planName ?? "Mesocycle")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(Theme.textPrimary)

                Text(dateRange)
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                GenericBadge(
                    text: mesocycle.status == .completed ? "Completed" : "Cancelled",
                    color: mesocycle.status == .completed ? Theme.success : Theme.statusSkipped
                )

                Text("\(mesocycle.completedWorkouts ?? 0)/\(mesocycle.totalWorkouts ?? 0) workouts")
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
    }

    private var dateRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        let start = formatter.string(from: mesocycle.startDate)

        if let endDate = Calendar.current.date(byAdding: .weekOfYear, value: 7, to: mesocycle.startDate) {
            let end = formatter.string(from: endDate)
            return "\(start) - \(end)"
        }
        return start
    }
}

/// Sheet for creating a new mesocycle
struct NewMesocycleSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var selectedPlan: Plan? = Plan.mockPlans.first
    @State private var startDate: Date = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section("Plan") {
                    Picker("Select Plan", selection: $selectedPlan) {
                        ForEach(Plan.mockPlans) { plan in
                            Text(plan.name).tag(plan as Plan?)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Start Date") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                        .datePickerStyle(.graphical)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("New Mesocycle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Start") {
                        // Start mesocycle action
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(selectedPlan == nil)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        MesoView(navigationPath: .constant(NavigationPath()))
    }
    .environmentObject(AppState())
    .preferredColorScheme(.dark)
}
