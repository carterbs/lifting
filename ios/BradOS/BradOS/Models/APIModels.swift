import Foundation

/// Response from calendar API
struct CalendarData: Codable {
    let startDate: String
    let endDate: String
    let days: [String: CalendarDayData]
}

/// Statistics from meditation sessions API
struct MeditationStats: Codable {
    let totalSessions: Int
    let totalMinutes: Int
    // Note: streak fields are not yet implemented in the API
    var currentStreak: Int?
    var longestStreak: Int?
}

/// Exercise history from API
struct ExerciseHistory: Codable {
    let exerciseId: Int
    let exerciseName: String
    let entries: [ExerciseHistoryEntry]
    let personalRecord: PersonalRecord?

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case exerciseName = "exercise_name"
        case entries
        case personalRecord = "personal_record"
    }

    /// Creates a minimal Exercise object from the history data
    var exercise: Exercise {
        Exercise(
            id: exerciseId,
            name: exerciseName,
            weightIncrement: 5, // Default, not provided by history endpoint
            isCustom: false,    // Default, not provided by history endpoint
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

/// A single entry in exercise history
struct ExerciseHistoryEntry: Codable, Identifiable {
    var id: Int { workoutId }
    let workoutId: Int
    let date: Date
    let weekNumber: Int
    let mesocycleId: Int
    let sets: [HistorySet]
    let bestWeight: Double
    let bestSetReps: Int

    enum CodingKeys: String, CodingKey {
        case workoutId = "workout_id"
        case date
        case weekNumber = "week_number"
        case mesocycleId = "mesocycle_id"
        case sets
        case bestWeight = "best_weight"
        case bestSetReps = "best_set_reps"
    }
}

/// A set within exercise history (simplified format from server)
struct HistorySet: Codable {
    let setNumber: Int
    let weight: Double
    let reps: Int

    enum CodingKeys: String, CodingKey {
        case setNumber = "set_number"
        case weight
        case reps
    }
}

/// Personal record for an exercise
struct PersonalRecord: Codable {
    let weight: Double
    let reps: Int
    let date: Date
}

// MARK: - Mock Data

extension MeditationStats {
    static let mockStats = MeditationStats(
        totalSessions: 42,
        totalMinutes: 315,
        currentStreak: 7,
        longestStreak: 14
    )

    /// Current streak with default fallback
    var displayCurrentStreak: Int { currentStreak ?? 0 }

    /// Longest streak with default fallback
    var displayLongestStreak: Int { longestStreak ?? 0 }
}

extension ExerciseHistory {
    static let mockHistory = ExerciseHistory(
        exerciseId: 1,
        exerciseName: "Bench Press",
        entries: [],
        personalRecord: PersonalRecord(
            weight: 185,
            reps: 8,
            date: Date()
        )
    )
}
