import Foundation

/// Status of a mesocycle
enum MesocycleStatus: String, Codable {
    case pending
    case active
    case completed
    case cancelled
}

/// A 6-week training cycle instance
struct Mesocycle: Identifiable, Codable, Hashable {
    let id: Int
    let planId: Int
    var startDate: Date
    var currentWeek: Int // 0-7 (7 is deload)
    var status: MesocycleStatus
    let createdAt: Date
    var updatedAt: Date

    // Extended fields
    var planName: String?
    var weeks: [WeekSummary]?
    var totalWorkouts: Int?
    var completedWorkouts: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case planId = "plan_id"
        case startDate = "start_date"
        case currentWeek = "current_week"
        case status
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case planName = "plan_name"
        case weeks
        case totalWorkouts = "total_workouts"
        case completedWorkouts = "completed_workouts"
    }

    var isDeloadWeek: Bool {
        currentWeek == 7
    }

    var progressPercentage: Double {
        guard let total = totalWorkouts, total > 0,
              let completed = completedWorkouts else { return 0 }
        return Double(completed) / Double(total)
    }
}

/// Summary of a week within a mesocycle
struct WeekSummary: Identifiable, Codable, Hashable {
    var id: Int { weekNumber }
    let weekNumber: Int
    var workouts: [WorkoutSummary]
    var isDeload: Bool
    var isComplete: Bool

    enum CodingKeys: String, CodingKey {
        case weekNumber = "week_number"
        case workouts
        case isDeload = "is_deload"
        case isComplete = "is_complete"
    }
}

/// Brief summary of a workout for week views
struct WorkoutSummary: Identifiable, Codable, Hashable {
    let id: Int
    let scheduledDate: Date
    var status: WorkoutStatus
    var dayName: String

    enum CodingKeys: String, CodingKey {
        case id
        case scheduledDate = "scheduled_date"
        case status
        case dayName = "day_name"
    }
}

// MARK: - Mock Data
extension Mesocycle {
    static let mockActiveMesocycle: Mesocycle = Mesocycle(
        id: 1,
        planId: 1,
        startDate: Calendar.current.date(byAdding: .weekOfYear, value: -2, to: Date())!,
        currentWeek: 2,
        status: .active,
        createdAt: Date(),
        updatedAt: Date(),
        planName: "Push Pull Legs",
        weeks: nil,
        totalWorkouts: 21,
        completedWorkouts: 6
    )

    static let mockCompletedMesocycles: [Mesocycle] = [
        Mesocycle(
            id: 2,
            planId: 1,
            startDate: Calendar.current.date(byAdding: .month, value: -3, to: Date())!,
            currentWeek: 7,
            status: .completed,
            createdAt: Date(),
            updatedAt: Date(),
            planName: "Push Pull Legs",
            weeks: nil,
            totalWorkouts: 21,
            completedWorkouts: 21
        )
    ]
}
