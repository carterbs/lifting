import Foundation

/// Status of a mesocycle
public enum MesocycleStatus: String, Codable, Sendable {
    case pending
    case active
    case completed
    case cancelled
}

/// A 6-week training cycle instance
public struct Mesocycle: Identifiable, Codable, Hashable, Sendable {
    public let id: Int
    public let planId: Int
    public var startDate: Date
    public var currentWeek: Int // 0-7 (7 is deload)
    public var status: MesocycleStatus
    public let createdAt: Date
    public var updatedAt: Date

    // Extended fields
    public var planName: String?
    public var weeks: [WeekSummary]?
    public var totalWorkouts: Int?
    public var completedWorkouts: Int?

    public enum CodingKeys: String, CodingKey {
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

    public init(
        id: Int,
        planId: Int,
        startDate: Date,
        currentWeek: Int,
        status: MesocycleStatus,
        createdAt: Date,
        updatedAt: Date,
        planName: String? = nil,
        weeks: [WeekSummary]? = nil,
        totalWorkouts: Int? = nil,
        completedWorkouts: Int? = nil
    ) {
        self.id = id
        self.planId = planId
        self.startDate = startDate
        self.currentWeek = currentWeek
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.planName = planName
        self.weeks = weeks
        self.totalWorkouts = totalWorkouts
        self.completedWorkouts = completedWorkouts
    }

    public var isDeloadWeek: Bool {
        currentWeek == 7
    }

    public var progressPercentage: Double {
        guard let total = totalWorkouts, total > 0,
              let completed = completedWorkouts else { return 0 }
        return Double(completed) / Double(total)
    }
}

/// Summary of a week within a mesocycle
public struct WeekSummary: Identifiable, Codable, Hashable, Sendable {
    public var id: Int { weekNumber }
    public let weekNumber: Int
    public var workouts: [WorkoutSummary]
    public var isDeload: Bool

    public enum CodingKeys: String, CodingKey {
        case weekNumber = "week_number"
        case workouts
        case isDeload = "is_deload"
    }

    public init(weekNumber: Int, workouts: [WorkoutSummary], isDeload: Bool) {
        self.weekNumber = weekNumber
        self.workouts = workouts
        self.isDeload = isDeload
    }

    /// Computed property: week is complete when all workouts are completed or skipped
    public var isComplete: Bool {
        workouts.allSatisfy { $0.status == .completed || $0.status == .skipped }
    }
}

/// Brief summary of a workout for week views
public struct WorkoutSummary: Identifiable, Codable, Hashable, Sendable {
    public let id: Int
    public let scheduledDate: Date
    public var status: WorkoutStatus
    public var planDayName: String

    public enum CodingKeys: String, CodingKey {
        case id
        case scheduledDate = "scheduled_date"
        case status
        case planDayName = "plan_day_name"
    }

    public init(id: Int, scheduledDate: Date, status: WorkoutStatus, planDayName: String) {
        self.id = id
        self.scheduledDate = scheduledDate
        self.status = status
        self.planDayName = planDayName
    }

    /// Convenience property for display (matches old dayName usage)
    public var dayName: String { planDayName }
}

// MARK: - Mock Data
public extension Mesocycle {
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
