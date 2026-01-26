import Foundation

/// Status of a workout
enum WorkoutStatus: String, Codable {
    case pending
    case inProgress = "in_progress"
    case completed
    case skipped
}

/// A scheduled workout instance
struct Workout: Identifiable, Codable, Hashable {
    let id: Int
    let mesocycleId: Int
    let planDayId: Int
    var weekNumber: Int
    var scheduledDate: Date
    var status: WorkoutStatus
    var startedAt: Date?
    var completedAt: Date?

    // Extended fields
    var exercises: [WorkoutExercise]?
    var planDayName: String?
    var sets: [WorkoutSet]?

    enum CodingKeys: String, CodingKey {
        case id
        case mesocycleId = "mesocycle_id"
        case planDayId = "plan_day_id"
        case weekNumber = "week_number"
        case scheduledDate = "scheduled_date"
        case status
        case startedAt = "started_at"
        case completedAt = "completed_at"
        case exercises
        case planDayName = "plan_day_name"
        case sets
    }

    var statusDisplayName: String {
        switch status {
        case .pending: return "Scheduled"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .skipped: return "Skipped"
        }
    }
}

/// An exercise within a workout with all its sets
struct WorkoutExercise: Identifiable, Codable, Hashable {
    var id: Int { exerciseId }
    let exerciseId: Int
    let exerciseName: String
    var sets: [WorkoutSet]
    var totalSets: Int
    var completedSets: Int
    var restSeconds: Int

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case exerciseName = "exercise_name"
        case sets
        case totalSets = "total_sets"
        case completedSets = "completed_sets"
        case restSeconds = "rest_seconds"
    }

    var formattedRestTime: String {
        if restSeconds < 60 {
            return "\(restSeconds)s"
        } else if restSeconds % 60 == 0 {
            return "\(restSeconds / 60)m"
        } else {
            return "\(restSeconds / 60)m \(restSeconds % 60)s"
        }
    }
}

/// Status of an individual set
enum SetStatus: String, Codable {
    case pending
    case completed
    case skipped
}

/// An individual set within a workout
struct WorkoutSet: Identifiable, Codable, Hashable {
    let id: Int
    let workoutId: Int
    let exerciseId: Int
    var setNumber: Int
    var targetReps: Int
    var targetWeight: Double
    var actualReps: Int?
    var actualWeight: Double?
    var status: SetStatus

    enum CodingKeys: String, CodingKey {
        case id
        case workoutId = "workout_id"
        case exerciseId = "exercise_id"
        case setNumber = "set_number"
        case targetReps = "target_reps"
        case targetWeight = "target_weight"
        case actualReps = "actual_reps"
        case actualWeight = "actual_weight"
        case status
    }
}

// MARK: - Mock Data
extension Workout {
    static let mockTodayWorkout: Workout = Workout(
        id: 1,
        mesocycleId: 1,
        planDayId: 1,
        weekNumber: 2,
        scheduledDate: Date(),
        status: .pending,
        startedAt: nil,
        completedAt: nil,
        exercises: [
            WorkoutExercise(
                exerciseId: 1,
                exerciseName: "Bench Press",
                sets: [
                    WorkoutSet(id: 1, workoutId: 1, exerciseId: 1, setNumber: 1, targetReps: 10, targetWeight: 135, actualReps: nil, actualWeight: nil, status: .pending),
                    WorkoutSet(id: 2, workoutId: 1, exerciseId: 1, setNumber: 2, targetReps: 10, targetWeight: 135, actualReps: nil, actualWeight: nil, status: .pending),
                    WorkoutSet(id: 3, workoutId: 1, exerciseId: 1, setNumber: 3, targetReps: 10, targetWeight: 135, actualReps: nil, actualWeight: nil, status: .pending)
                ],
                totalSets: 3,
                completedSets: 0,
                restSeconds: 90
            ),
            WorkoutExercise(
                exerciseId: 4,
                exerciseName: "Overhead Press",
                sets: [
                    WorkoutSet(id: 4, workoutId: 1, exerciseId: 4, setNumber: 1, targetReps: 10, targetWeight: 95, actualReps: nil, actualWeight: nil, status: .pending),
                    WorkoutSet(id: 5, workoutId: 1, exerciseId: 4, setNumber: 2, targetReps: 10, targetWeight: 95, actualReps: nil, actualWeight: nil, status: .pending),
                    WorkoutSet(id: 6, workoutId: 1, exerciseId: 4, setNumber: 3, targetReps: 10, targetWeight: 95, actualReps: nil, actualWeight: nil, status: .pending)
                ],
                totalSets: 3,
                completedSets: 0,
                restSeconds: 90
            )
        ],
        planDayName: "Push Day",
        sets: nil
    )
}
