import Foundation

/// A workout plan template
public struct Plan: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var name: String
    public var durationWeeks: Int
    public let createdAt: Date
    public var updatedAt: Date
    public var days: [PlanDay]?

    public enum CodingKeys: String, CodingKey {
        case id
        case name
        case durationWeeks = "duration_weeks"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case days
    }

    public init(
        id: String,
        name: String,
        durationWeeks: Int,
        createdAt: Date,
        updatedAt: Date,
        days: [PlanDay]? = nil
    ) {
        self.id = id
        self.name = name
        self.durationWeeks = durationWeeks
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.days = days
    }
}

/// A day within a workout plan
public struct PlanDay: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let planId: String
    public var dayOfWeek: Int // 0-6 (Sunday-Saturday)
    public var name: String
    public var sortOrder: Int
    public var exercises: [PlanDayExercise]?

    public enum CodingKeys: String, CodingKey {
        case id
        case planId = "plan_id"
        case dayOfWeek = "day_of_week"
        case name
        case sortOrder = "sort_order"
        case exercises
    }

    public init(
        id: String,
        planId: String,
        dayOfWeek: Int,
        name: String,
        sortOrder: Int,
        exercises: [PlanDayExercise]? = nil
    ) {
        self.id = id
        self.planId = planId
        self.dayOfWeek = dayOfWeek
        self.name = name
        self.sortOrder = sortOrder
        self.exercises = exercises
    }

    public var dayOfWeekName: String {
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        guard dayOfWeek >= 0 && dayOfWeek < days.count else { return "Unknown" }
        return days[dayOfWeek]
    }
}

/// An exercise configuration within a plan day
public struct PlanDayExercise: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let planDayId: String
    public let exerciseId: String
    public var sets: Int
    public var reps: Int
    public var weight: Double
    public var restSeconds: Int
    public var sortOrder: Int
    public var minReps: Int
    public var maxReps: Int
    public var exerciseName: String?

    public enum CodingKeys: String, CodingKey {
        case id
        case planDayId = "plan_day_id"
        case exerciseId = "exercise_id"
        case sets
        case reps
        case weight
        case restSeconds = "rest_seconds"
        case sortOrder = "sort_order"
        case minReps = "min_reps"
        case maxReps = "max_reps"
        case exerciseName = "exercise_name"
    }

    public init(
        id: String,
        planDayId: String,
        exerciseId: String,
        sets: Int,
        reps: Int,
        weight: Double,
        restSeconds: Int,
        sortOrder: Int,
        minReps: Int,
        maxReps: Int,
        exerciseName: String? = nil
    ) {
        self.id = id
        self.planDayId = planDayId
        self.exerciseId = exerciseId
        self.sets = sets
        self.reps = reps
        self.weight = weight
        self.restSeconds = restSeconds
        self.sortOrder = sortOrder
        self.minReps = minReps
        self.maxReps = maxReps
        self.exerciseName = exerciseName
    }
}

// MARK: - Mock Data
public extension Plan {
    static let mockPlans: [Plan] = [
        Plan(
            id: "mock-plan-1",
            name: "Push Pull Legs",
            durationWeeks: 6,
            createdAt: Date(),
            updatedAt: Date(),
            days: [
                PlanDay(id: "mock-planday-1", planId: "mock-plan-1", dayOfWeek: 1, name: "Push Day", sortOrder: 0, exercises: nil),
                PlanDay(id: "mock-planday-2", planId: "mock-plan-1", dayOfWeek: 3, name: "Pull Day", sortOrder: 1, exercises: nil),
                PlanDay(id: "mock-planday-3", planId: "mock-plan-1", dayOfWeek: 5, name: "Leg Day", sortOrder: 2, exercises: nil)
            ]
        ),
        Plan(
            id: "mock-plan-2",
            name: "Upper Lower Split",
            durationWeeks: 6,
            createdAt: Date(),
            updatedAt: Date(),
            days: [
                PlanDay(id: "mock-planday-4", planId: "mock-plan-2", dayOfWeek: 1, name: "Upper A", sortOrder: 0, exercises: nil),
                PlanDay(id: "mock-planday-5", planId: "mock-plan-2", dayOfWeek: 2, name: "Lower A", sortOrder: 1, exercises: nil),
                PlanDay(id: "mock-planday-6", planId: "mock-plan-2", dayOfWeek: 4, name: "Upper B", sortOrder: 2, exercises: nil),
                PlanDay(id: "mock-planday-7", planId: "mock-plan-2", dayOfWeek: 5, name: "Lower B", sortOrder: 3, exercises: nil)
            ]
        )
    ]
}
