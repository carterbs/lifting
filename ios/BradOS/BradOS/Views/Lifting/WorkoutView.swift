import SwiftUI

/// Full workout tracking view
struct WorkoutView: View {
    let workoutId: Int

    // Placeholder state - will be replaced with actual data
    @State private var workout: Workout? = Workout.mockTodayWorkout
    @State private var showingCompleteAlert: Bool = false
    @State private var showingSkipAlert: Bool = false
    @State private var activeRestTimer: RestTimerState? = nil

    var body: some View {
        ZStack {
            ScrollView {
                if let workout = workout {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Header Info
                        workoutHeader(workout)

                        // Action Buttons
                        actionButtons(workout)

                        // Exercises
                        if let exercises = workout.exercises {
                            exercisesSection(exercises, workoutStatus: workout.status)
                        }
                    }
                    .padding(Theme.Spacing.md)
                    .padding(.bottom, activeRestTimer != nil ? 100 : 0)
                } else {
                    LoadingView()
                }
            }
            .background(Theme.background)

            // Rest Timer Overlay
            if let timer = activeRestTimer {
                VStack {
                    Spacer()
                    RestTimerView(state: timer) {
                        activeRestTimer = nil
                    }
                }
            }
        }
        .navigationTitle(workout?.planDayName ?? "Workout")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Complete Workout?", isPresented: $showingCompleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Complete") {
                // Complete workout action
            }
        } message: {
            let pendingSets = workout?.exercises?.reduce(0) { $0 + ($1.totalSets - $1.completedSets) } ?? 0
            if pendingSets > 0 {
                Text("You have \(pendingSets) sets remaining. Complete anyway?")
            } else {
                Text("Great work! Mark this workout as complete?")
            }
        }
        .alert("Skip Workout?", isPresented: $showingSkipAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Skip", role: .destructive) {
                // Skip workout action
            }
        } message: {
            Text("This workout will be marked as skipped. You can always come back and complete it later.")
        }
    }

    // MARK: - Header

    @ViewBuilder
    private func workoutHeader(_ workout: Workout) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(workout.planDayName ?? "Workout")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.textPrimary)

                    Text(formattedDate(workout.scheduledDate))
                        .font(.subheadline)
                        .foregroundColor(Theme.textSecondary)
                }

                Spacer()

                StatusBadge(status: workout.status)
            }

            if workout.weekNumber == 7 {
                GenericBadge(text: "Deload Week", color: Theme.warning)
            } else {
                GenericBadge(text: "Week \(workout.weekNumber)", color: Theme.accent)
            }
        }
        .padding(Theme.Spacing.md)
        .cardStyle()
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        return formatter.string(from: date)
    }

    // MARK: - Action Buttons

    @ViewBuilder
    private func actionButtons(_ workout: Workout) -> some View {
        HStack(spacing: Theme.Spacing.md) {
            switch workout.status {
            case .pending:
                Button(action: startWorkout) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start Workout")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Button(action: { showingSkipAlert = true }) {
                    Text("Skip")
                }
                .buttonStyle(SecondaryButtonStyle())

            case .inProgress:
                Button(action: { showingCompleteAlert = true }) {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("Complete")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())

                Button(action: { showingSkipAlert = true }) {
                    Text("Skip")
                }
                .buttonStyle(SecondaryButtonStyle())

            case .completed, .skipped:
                EmptyView()
            }
        }
    }

    private func startWorkout() {
        workout?.status = .inProgress
        workout?.startedAt = Date()
    }

    // MARK: - Exercises Section

    @ViewBuilder
    private func exercisesSection(_ exercises: [WorkoutExercise], workoutStatus: WorkoutStatus) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Exercises")

            ForEach(exercises) { exercise in
                ExerciseCard(
                    exercise: exercise,
                    isEditable: workoutStatus == .inProgress,
                    onSetLogged: { setId in
                        // Start rest timer
                        activeRestTimer = RestTimerState(
                            targetSeconds: exercise.restSeconds,
                            startedAt: Date()
                        )
                    }
                )
            }
        }
    }
}

/// Card displaying an exercise with its sets
struct ExerciseCard: View {
    let exercise: WorkoutExercise
    let isEditable: Bool
    let onSetLogged: (Int) -> Void

    @State private var sets: [WorkoutSet]

    init(exercise: WorkoutExercise, isEditable: Bool, onSetLogged: @escaping (Int) -> Void) {
        self.exercise = exercise
        self.isEditable = isEditable
        self.onSetLogged = onSetLogged
        self._sets = State(initialValue: exercise.sets)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(exercise.exerciseName)
                        .font(.headline)
                        .foregroundColor(Theme.textPrimary)

                    Text("Rest: \(exercise.formattedRestTime)")
                        .font(.caption)
                        .foregroundColor(Theme.textSecondary)
                }

                Spacer()

                GenericBadge(
                    text: "\(completedSets)/\(exercise.totalSets) sets",
                    color: completedSets == exercise.totalSets ? Theme.success : Theme.accent
                )
            }

            Divider()
                .background(Theme.border)

            // Sets
            VStack(spacing: Theme.Spacing.sm) {
                // Header row
                HStack {
                    Text("Set")
                        .frame(width: 40)
                    Text("Weight")
                        .frame(maxWidth: .infinity)
                    Text("Reps")
                        .frame(maxWidth: .infinity)
                    Text("")
                        .frame(width: 44)
                }
                .font(.caption)
                .foregroundColor(Theme.textSecondary)

                ForEach(Array(sets.enumerated()), id: \.element.id) { index, set in
                    SetRow(
                        set: set,
                        setNumber: index + 1,
                        isEditable: isEditable,
                        onLog: {
                            sets[index].status = .completed
                            sets[index].actualReps = set.targetReps
                            sets[index].actualWeight = set.targetWeight
                            onSetLogged(set.id)
                        }
                    )
                }
            }

            // Add Set Button (if in progress)
            if isEditable {
                Button(action: addSet) {
                    HStack {
                        Image(systemName: "plus")
                        Text("Add Set")
                    }
                    .font(.subheadline)
                    .foregroundColor(Theme.accent)
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

    private var completedSets: Int {
        sets.filter { $0.status == .completed }.count
    }

    private func addSet() {
        let lastSet = sets.last
        let newSet = WorkoutSet(
            id: (sets.last?.id ?? 0) + 1,
            workoutId: exercise.sets.first?.workoutId ?? 0,
            exerciseId: exercise.exerciseId,
            setNumber: sets.count + 1,
            targetReps: lastSet?.targetReps ?? 10,
            targetWeight: lastSet?.targetWeight ?? 0,
            actualReps: nil,
            actualWeight: nil,
            status: .pending
        )
        sets.append(newSet)
    }
}

/// Row displaying a single set
struct SetRow: View {
    let set: WorkoutSet
    let setNumber: Int
    let isEditable: Bool
    let onLog: () -> Void

    @State private var weight: String
    @State private var reps: String

    init(set: WorkoutSet, setNumber: Int, isEditable: Bool, onLog: @escaping () -> Void) {
        self.set = set
        self.setNumber = setNumber
        self.isEditable = isEditable
        self.onLog = onLog
        self._weight = State(initialValue: "\(Int(set.actualWeight ?? set.targetWeight))")
        self._reps = State(initialValue: "\(set.actualReps ?? set.targetReps)")
    }

    var body: some View {
        HStack {
            // Set number
            ZStack {
                Circle()
                    .fill(set.status == .completed ? Theme.success : Theme.backgroundTertiary)
                    .frame(width: 28, height: 28)

                Text("\(setNumber)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(set.status == .completed ? .white : Theme.textPrimary)
            }
            .frame(width: 40)

            // Weight input
            TextField("Weight", text: $weight)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .padding(Theme.Spacing.sm)
                .background(Theme.backgroundTertiary)
                .cornerRadius(Theme.CornerRadius.sm)
                .disabled(!isEditable || set.status == .completed)
                .frame(maxWidth: .infinity)

            // Reps input
            TextField("Reps", text: $reps)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .padding(Theme.Spacing.sm)
                .background(Theme.backgroundTertiary)
                .cornerRadius(Theme.CornerRadius.sm)
                .disabled(!isEditable || set.status == .completed)
                .frame(maxWidth: .infinity)

            // Checkbox / Log button
            Button(action: onLog) {
                Image(systemName: set.status == .completed ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(set.status == .completed ? Theme.success : Theme.textSecondary)
            }
            .disabled(!isEditable || set.status == .completed)
            .frame(width: 44)
        }
        .opacity(set.status == .completed ? 0.7 : 1)
    }
}

/// Rest timer state
struct RestTimerState {
    let targetSeconds: Int
    let startedAt: Date

    var remainingSeconds: Int {
        let elapsed = Int(Date().timeIntervalSince(startedAt))
        return max(0, targetSeconds - elapsed)
    }

    var isComplete: Bool {
        remainingSeconds <= 0
    }
}

/// Rest timer overlay view
struct RestTimerView: View {
    let state: RestTimerState
    let onDismiss: () -> Void

    @State private var remainingSeconds: Int

    init(state: RestTimerState, onDismiss: @escaping () -> Void) {
        self.state = state
        self.onDismiss = onDismiss
        self._remainingSeconds = State(initialValue: state.remainingSeconds)
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Rest Timer")
                    .font(.caption)
                    .foregroundColor(Theme.textSecondary)

                Text(formattedTime)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(remainingSeconds <= 0 ? Theme.success : Theme.textPrimary)
                    .monospacedDigit()
            }

            Spacer()

            if remainingSeconds <= 0 {
                Text("Ready!")
                    .font(.headline)
                    .foregroundColor(Theme.success)
            }

            Button(action: onDismiss) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(Theme.textSecondary)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.backgroundSecondary)
        .cornerRadius(Theme.CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.CornerRadius.md)
                .stroke(remainingSeconds <= 0 ? Theme.success : Theme.accent, lineWidth: 2)
        )
        .padding(Theme.Spacing.md)
        .shadow(color: .black.opacity(0.3), radius: 10)
        .onAppear {
            startTimer()
        }
    }

    private var formattedTime: String {
        let minutes = remainingSeconds / 60
        let seconds = remainingSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    private func startTimer() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            remainingSeconds = state.remainingSeconds
            if remainingSeconds <= 0 {
                timer.invalidate()
            }
        }
    }
}

#Preview {
    NavigationStack {
        WorkoutView(workoutId: 1)
    }
    .preferredColorScheme(.dark)
}
