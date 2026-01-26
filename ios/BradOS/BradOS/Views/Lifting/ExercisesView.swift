import SwiftUI

/// View displaying exercise library
struct ExercisesView: View {
    // Placeholder state - will be replaced with actual data
    @State private var exercises: [Exercise] = Exercise.mockExercises
    @State private var showingAddExercise: Bool = false
    @State private var newExerciseName: String = ""
    @State private var searchText: String = ""

    private var filteredExercises: [Exercise] {
        if searchText.isEmpty {
            return exercises
        }
        return exercises.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.md) {
                // Add Exercise Section
                addExerciseSection

                // Exercise List
                if filteredExercises.isEmpty {
                    if searchText.isEmpty {
                        EmptyStateView(
                            iconName: "dumbbell",
                            title: "No Exercises",
                            message: "Add your first exercise to get started."
                        )
                    } else {
                        EmptyStateView(
                            iconName: "magnifyingglass",
                            title: "No Results",
                            message: "No exercises match '\(searchText)'"
                        )
                    }
                } else {
                    exerciseListSection
                }
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.background)
        .navigationTitle("Exercises")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $searchText, prompt: "Search exercises")
    }

    // MARK: - Add Exercise Section

    @ViewBuilder
    private var addExerciseSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("Add Exercise")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(Theme.textPrimary)

            HStack(spacing: Theme.Spacing.sm) {
                TextField("Exercise name", text: $newExerciseName)
                    .textFieldStyle(.plain)
                    .padding(Theme.Spacing.sm)
                    .background(Theme.backgroundTertiary)
                    .cornerRadius(Theme.CornerRadius.sm)

                Button(action: addExercise) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(newExerciseName.isEmpty ? Theme.disabled : Theme.accent)
                }
                .disabled(newExerciseName.isEmpty)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
    }

    private func addExercise() {
        guard !newExerciseName.isEmpty else { return }

        let newExercise = Exercise(
            id: exercises.count + 1,
            name: newExerciseName,
            weightIncrement: 5,
            isCustom: true,
            createdAt: Date(),
            updatedAt: Date()
        )
        exercises.append(newExercise)
        newExerciseName = ""
    }

    // MARK: - Exercise List

    @ViewBuilder
    private var exerciseListSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "All Exercises")

            ForEach(filteredExercises) { exercise in
                ExerciseRow(exercise: exercise) {
                    // Delete action
                    exercises.removeAll { $0.id == exercise.id }
                }
            }
        }
    }
}

/// Row displaying an exercise
struct ExerciseRow: View {
    let exercise: Exercise
    let onDelete: () -> Void

    @State private var showingDeleteAlert: Bool = false

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name)
                    .font(.subheadline)
                    .foregroundColor(Theme.textPrimary)

                HStack(spacing: Theme.Spacing.sm) {
                    Text("+\(Int(exercise.weightIncrement)) lbs/progression")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)

                    if exercise.isCustom {
                        Text("•")
                            .foregroundColor(Theme.textSecondary)
                        Text("Custom")
                            .font(.caption)
                            .foregroundColor(Theme.accent)
                    }
                }
            }

            Spacer()

            Menu {
                NavigationLink(value: ExerciseHistoryDestination(exerciseId: exercise.id, exerciseName: exercise.name)) {
                    Label("View History", systemImage: "clock")
                }

                Button(role: .destructive, action: { showingDeleteAlert = true }) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundColor(Theme.textSecondary)
                    .padding(Theme.Spacing.sm)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
        .alert("Delete Exercise?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive, action: onDelete)
        } message: {
            Text("This will remove '\(exercise.name)' from your exercise library. This won't affect existing workout history.")
        }
    }
}

/// View displaying exercise history
struct ExerciseHistoryView: View {
    let exerciseId: Int
    let exerciseName: String

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                // Progress Chart Placeholder
                progressChartSection

                // History List Placeholder
                historySection
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.background)
        .navigationTitle(exerciseName)
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private var progressChartSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Progress")

            VStack(spacing: Theme.Spacing.md) {
                // Placeholder chart
                RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                    .fill(Theme.backgroundTertiary)
                    .frame(height: 200)
                    .overlay(
                        VStack {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 40))
                                .foregroundColor(Theme.textSecondary)
                            Text("Progress Chart")
                                .font(.caption)
                                .foregroundColor(Theme.textSecondary)
                        }
                    )

                // Stats
                HStack(spacing: Theme.Spacing.lg) {
                    VStack {
                        Text("135")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Theme.accent)
                        Text("Current (lbs)")
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }

                    Divider()
                        .frame(height: 40)

                    VStack {
                        Text("95")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Theme.textSecondary)
                        Text("Starting (lbs)")
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }

                    Divider()
                        .frame(height: 40)

                    VStack {
                        Text("+40")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(Theme.success)
                        Text("Gained (lbs)")
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(Theme.Spacing.md)
            .cardStyle()
        }
    }

    @ViewBuilder
    private var historySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Recent Sessions")

            // Placeholder history items
            ForEach(0..<5, id: \.self) { index in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Week \(5 - index)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(Theme.textPrimary)

                        Text(Calendar.current.date(byAdding: .weekOfYear, value: -index, to: Date())!.formatted(date: .abbreviated, time: .omitted))
                            .font(.caption)
                            .foregroundColor(Theme.textSecondary)
                    }

                    Spacer()

                    Text("3×10 @ \(135 - index * 5) lbs")
                        .font(.subheadline)
                        .foregroundColor(Theme.textSecondary)
                }
                .padding(Theme.Spacing.md)
                .background(Theme.backgroundSecondary)
                .cornerRadius(Theme.CornerRadius.md)
            }
        }
    }
}

#Preview {
    NavigationStack {
        ExercisesView()
    }
    .preferredColorScheme(.dark)
}
