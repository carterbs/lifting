import Foundation

/// Response from calendar API
public struct CalendarData: Codable, Sendable {
    public let startDate: String
    public let endDate: String
    public let days: [String: CalendarDayData]

    public init(startDate: String, endDate: String, days: [String: CalendarDayData]) {
        self.startDate = startDate
        self.endDate = endDate
        self.days = days
    }
}

/// Statistics from meditation sessions API
public struct MeditationStats: Codable, Sendable {
    public let totalSessions: Int
    public let totalMinutes: Int
    // Note: streak fields are not yet implemented in the API
    public var currentStreak: Int?
    public var longestStreak: Int?

    public init(
        totalSessions: Int,
        totalMinutes: Int,
        currentStreak: Int? = nil,
        longestStreak: Int? = nil
    ) {
        self.totalSessions = totalSessions
        self.totalMinutes = totalMinutes
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
    }

    /// Current streak with default fallback
    public var displayCurrentStreak: Int { currentStreak ?? 0 }

    /// Longest streak with default fallback
    public var displayLongestStreak: Int { longestStreak ?? 0 }
}

/// Exercise history from API
public struct ExerciseHistory: Codable, Sendable {
    public let exerciseId: Int
    public let exerciseName: String
    public let entries: [ExerciseHistoryEntry]
    public let personalRecord: PersonalRecord?

    public enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case exerciseName = "exercise_name"
        case entries
        case personalRecord = "personal_record"
    }

    public init(
        exerciseId: Int,
        exerciseName: String,
        entries: [ExerciseHistoryEntry],
        personalRecord: PersonalRecord?
    ) {
        self.exerciseId = exerciseId
        self.exerciseName = exerciseName
        self.entries = entries
        self.personalRecord = personalRecord
    }

    /// Creates a minimal Exercise object from the history data
    public var exercise: Exercise {
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
public struct ExerciseHistoryEntry: Codable, Identifiable, Sendable {
    public var id: Int { workoutId }
    public let workoutId: Int
    public let date: Date
    public let weekNumber: Int
    public let mesocycleId: Int
    public let sets: [HistorySet]
    public let bestWeight: Double
    public let bestSetReps: Int

    public enum CodingKeys: String, CodingKey {
        case workoutId = "workout_id"
        case date
        case weekNumber = "week_number"
        case mesocycleId = "mesocycle_id"
        case sets
        case bestWeight = "best_weight"
        case bestSetReps = "best_set_reps"
    }

    public init(
        workoutId: Int,
        date: Date,
        weekNumber: Int,
        mesocycleId: Int,
        sets: [HistorySet],
        bestWeight: Double,
        bestSetReps: Int
    ) {
        self.workoutId = workoutId
        self.date = date
        self.weekNumber = weekNumber
        self.mesocycleId = mesocycleId
        self.sets = sets
        self.bestWeight = bestWeight
        self.bestSetReps = bestSetReps
    }
}

/// A set within exercise history (simplified format from server)
public struct HistorySet: Codable, Sendable {
    public let setNumber: Int
    public let weight: Double
    public let reps: Int

    public enum CodingKeys: String, CodingKey {
        case setNumber = "set_number"
        case weight
        case reps
    }

    public init(setNumber: Int, weight: Double, reps: Int) {
        self.setNumber = setNumber
        self.weight = weight
        self.reps = reps
    }
}

/// Personal record for an exercise
public struct PersonalRecord: Codable, Sendable {
    public let weight: Double
    public let reps: Int
    public let date: Date

    public init(weight: Double, reps: Int, date: Date) {
        self.weight = weight
        self.reps = reps
        self.date = date
    }
}

// MARK: - Mock Data

public extension MeditationStats {
    static let mockStats = MeditationStats(
        totalSessions: 42,
        totalMinutes: 315,
        currentStreak: 7,
        longestStreak: 14
    )
}

public extension ExerciseHistory {
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
