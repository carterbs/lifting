import Foundation

/// A workout plan template
struct Plan: Identifiable, Codable, Hashable {
    let id: Int
    var name: String
    var durationWeeks: Int
    let createdAt: Date
    var updatedAt: Date
    var days: [PlanDay]?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case durationWeeks = "duration_weeks"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case days
    }
}

/// A day within a workout plan
struct PlanDay: Identifiable, Codable, Hashable {
    let id: Int
    let planId: Int
    var dayOfWeek: Int // 0-6 (Sunday-Saturday)
    var name: String
    var sortOrder: Int
    var exercises: [PlanDayExercise]?

    enum CodingKeys: String, CodingKey {
        case id
        case planId = "plan_id"
        case dayOfWeek = "day_of_week"
        case name
        case sortOrder = "sort_order"
        case exercises
    }

    var dayOfWeekName: String {
        let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        guard dayOfWeek >= 0 && dayOfWeek < days.count else { return "Unknown" }
        return days[dayOfWeek]
    }
}

/// An exercise configuration within a plan day
struct PlanDayExercise: Identifiable, Codable, Hashable {
    let id: Int
    let planDayId: Int
    let exerciseId: Int
    var sets: Int
    var reps: Int
    var weight: Double
    var restSeconds: Int
    var sortOrder: Int
    var minReps: Int
    var maxReps: Int
    var exerciseName: String?

    enum CodingKeys: String, CodingKey {
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
}

// MARK: - Mock Data
extension Plan {
    static let mockPlans: [Plan] = [
        Plan(
            id: 1,
            name: "Push Pull Legs",
            durationWeeks: 6,
            createdAt: Date(),
            updatedAt: Date(),
            days: [
                PlanDay(id: 1, planId: 1, dayOfWeek: 1, name: "Push Day", sortOrder: 0, exercises: nil),
                PlanDay(id: 2, planId: 1, dayOfWeek: 3, name: "Pull Day", sortOrder: 1, exercises: nil),
                PlanDay(id: 3, planId: 1, dayOfWeek: 5, name: "Leg Day", sortOrder: 2, exercises: nil)
            ]
        ),
        Plan(
            id: 2,
            name: "Upper Lower Split",
            durationWeeks: 6,
            createdAt: Date(),
            updatedAt: Date(),
            days: [
                PlanDay(id: 4, planId: 2, dayOfWeek: 1, name: "Upper A", sortOrder: 0, exercises: nil),
                PlanDay(id: 5, planId: 2, dayOfWeek: 2, name: "Lower A", sortOrder: 1, exercises: nil),
                PlanDay(id: 6, planId: 2, dayOfWeek: 4, name: "Upper B", sortOrder: 2, exercises: nil),
                PlanDay(id: 7, planId: 2, dayOfWeek: 5, name: "Lower B", sortOrder: 3, exercises: nil)
            ]
        )
    ]
}
