import SwiftUI

/// View displaying workout plans library
struct PlansView: View {
    @Binding var navigationPath: NavigationPath

    // Placeholder state - will be replaced with actual data
    @State private var plans: [Plan] = Plan.mockPlans
    @State private var showingNewPlanSheet: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.md) {
                if plans.isEmpty {
                    EmptyStateView(
                        iconName: "list.bullet.clipboard",
                        title: "No Plans Yet",
                        message: "Create your first workout plan to get started.",
                        buttonTitle: "Create Plan"
                    ) {
                        showingNewPlanSheet = true
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    ForEach(plans) { plan in
                        PlanCard(plan: plan) {
                            navigationPath.append(PlanDestination(planId: plan.id))
                        }
                    }
                }
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.background)
        .navigationTitle("Plans")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingNewPlanSheet = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingNewPlanSheet) {
            CreatePlanSheet()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
    }
}

/// Card displaying a workout plan
struct PlanCard: View {
    let plan: Plan
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                HStack {
                    Text(plan.name)
                        .font(.headline)
                        .foregroundColor(Theme.textPrimary)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .foregroundColor(Theme.textSecondary)
                }

                HStack(spacing: Theme.Spacing.lg) {
                    Label("\(plan.durationWeeks) weeks", systemImage: "calendar")
                    Label("\(plan.days?.count ?? 0) days/week", systemImage: "repeat")
                }
                .font(.caption)
                .foregroundColor(Theme.textSecondary)

                if let days = plan.days, !days.isEmpty {
                    Divider()
                        .background(Theme.border)

                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(days.prefix(3)) { day in
                            HStack {
                                Text(day.dayOfWeekName)
                                    .font(.caption)
                                    .foregroundColor(Theme.textSecondary)
                                    .frame(width: 80, alignment: .leading)

                                Text(day.name)
                                    .font(.caption)
                                    .foregroundColor(Theme.textPrimary)
                            }
                        }

                        if days.count > 3 {
                            Text("+\(days.count - 3) more days")
                                .font(.caption)
                                .foregroundColor(Theme.accent)
                        }
                    }
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.backgroundSecondary)
            .cornerRadius(Theme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Detail view for a single plan
struct PlanDetailView: View {
    let planId: Int

    // Placeholder - will be fetched from API
    @State private var plan: Plan? = Plan.mockPlans.first
    @State private var showingEditSheet: Bool = false
    @State private var showingDeleteAlert: Bool = false

    var body: some View {
        ScrollView {
            if let plan = plan {
                VStack(spacing: Theme.Spacing.lg) {
                    // Plan Info
                    planInfoSection(plan)

                    // Days
                    if let days = plan.days {
                        daysSection(days)
                    }

                    // Actions
                    actionsSection
                }
                .padding(Theme.Spacing.md)
            } else {
                LoadingView()
            }
        }
        .background(Theme.background)
        .navigationTitle(plan?.name ?? "Plan")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingEditSheet = true }) {
                        Label("Edit Plan", systemImage: "pencil")
                    }
                    Button(role: .destructive, action: { showingDeleteAlert = true }) {
                        Label("Delete Plan", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .alert("Delete Plan?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                // Delete plan action
            }
        } message: {
            Text("This will permanently delete this plan. Any mesocycles using this plan will not be affected.")
        }
    }

    @ViewBuilder
    private func planInfoSection(_ plan: Plan) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Plan Details")

            HStack(spacing: Theme.Spacing.lg) {
                VStack {
                    Text("\(plan.durationWeeks)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.accent)
                    Text("weeks")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }

                Divider()
                    .frame(height: 40)

                VStack {
                    Text("\(plan.days?.count ?? 0)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.accent)
                    Text("days/week")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }

                Divider()
                    .frame(height: 40)

                VStack {
                    Text("\(totalExercises)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.accent)
                    Text("exercises")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.md)
            .cardStyle()
        }
    }

    private var totalExercises: Int {
        plan?.days?.reduce(0) { $0 + ($1.exercises?.count ?? 0) } ?? 0
    }

    @ViewBuilder
    private func daysSection(_ days: [PlanDay]) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Workout Days")

            ForEach(days) { day in
                PlanDayCard(day: day)
            }
        }
    }

    @ViewBuilder
    private var actionsSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            Button(action: { /* Start mesocycle with this plan */ }) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("Start Mesocycle")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
    }
}

/// Card displaying a plan day
struct PlanDayCard: View {
    let day: PlanDay

    @State private var isExpanded: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.name)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(Theme.textPrimary)

                        Text(day.dayOfWeekName)
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }

                    Spacer()

                    Text("\(day.exercises?.count ?? 0) exercises")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }
                .padding(Theme.Spacing.md)
            }
            .buttonStyle(PlainButtonStyle())

            // Expanded content
            if isExpanded, let exercises = day.exercises {
                Divider()
                    .background(Theme.border)

                VStack(spacing: 0) {
                    ForEach(exercises) { exercise in
                        HStack {
                            Text(exercise.exerciseName ?? "Exercise")
                                .font(.subheadline)
                                .foregroundColor(Theme.textPrimary)

                            Spacer()

                            Text("\(exercise.sets)×\(exercise.reps) @ \(Int(exercise.weight)) lbs")
                                .font(.caption)
                                .foregroundColor(Theme.textSecondary)
                        }
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.vertical, Theme.Spacing.sm)
                    }
                }
            }
        }
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                .stroke(Theme.border, lineWidth: 1)
        )
    }
}

/// Sheet for creating a new plan
struct CreatePlanSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var planName: String = ""
    @State private var durationWeeks: Int = 6

    var body: some View {
        NavigationStack {
            Form {
                Section("Plan Name") {
                    TextField("e.g., Push Pull Legs", text: $planName)
                }

                Section("Duration") {
                    Stepper("\(durationWeeks) weeks", value: $durationWeeks, in: 4...12)
                }

                Section {
                    Text("After creating the plan, you'll be able to add workout days and exercises.")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("New Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        // Create plan action
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(planName.isEmpty)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PlansView(navigationPath: .constant(NavigationPath()))
    }
    .preferredColorScheme(.dark)
}
