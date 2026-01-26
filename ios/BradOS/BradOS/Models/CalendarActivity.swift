import Foundation
import SwiftUI

/// Type of activity tracked in the app
enum ActivityType: String, Codable, CaseIterable {
    case workout
    case stretch
    case meditation

    var displayName: String {
        switch self {
        case .workout: return "Lifting"
        case .stretch: return "Stretch"
        case .meditation: return "Meditate"
        }
    }

    var color: Color {
        switch self {
        case .workout: return Theme.lifting
        case .stretch: return Theme.stretch
        case .meditation: return Theme.meditation
        }
    }

    var iconName: String {
        switch self {
        case .workout: return "dumbbell.fill"
        case .stretch: return "figure.flexibility"
        case .meditation: return "brain.head.profile"
        }
    }
}

/// An activity entry in the calendar
struct CalendarActivity: Identifiable, Codable, Hashable {
    let id: String
    let type: ActivityType
    let date: Date
    var completedAt: Date?
    var summary: ActivitySummary
}

/// Summary information for an activity
struct ActivitySummary: Codable, Hashable {
    // Workout fields
    var dayName: String?
    var exerciseCount: Int?
    var setsCompleted: Int?
    var totalSets: Int?
    var weekNumber: Int?
    var isDeload: Bool?

    // Stretch fields
    var totalDurationSeconds: Int?
    var regionsCompleted: Int?
    var regionsSkipped: Int?

    // Meditation fields
    var durationSeconds: Int?
    var meditationType: String?
}

/// Data for a single calendar day
struct CalendarDayData: Codable, Hashable {
    let date: Date
    var activities: [CalendarActivity]

    var hasWorkout: Bool {
        activities.contains { $0.type == .workout }
    }

    var hasStretch: Bool {
        activities.contains { $0.type == .stretch }
    }

    var hasMeditation: Bool {
        activities.contains { $0.type == .meditation }
    }
}

// MARK: - Mock Data
extension CalendarActivity {
    static let mockActivities: [CalendarActivity] = [
        CalendarActivity(
            id: "workout-1",
            type: .workout,
            date: Date(),
            completedAt: Date(),
            summary: ActivitySummary(
                dayName: "Push Day",
                exerciseCount: 5,
                setsCompleted: 15,
                totalSets: 15,
                weekNumber: 2,
                isDeload: false
            )
        ),
        CalendarActivity(
            id: "stretch-1",
            type: .stretch,
            date: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
            completedAt: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
            summary: ActivitySummary(
                totalDurationSeconds: 480,
                regionsCompleted: 8,
                regionsSkipped: 0
            )
        ),
        CalendarActivity(
            id: "meditation-1",
            type: .meditation,
            date: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
            completedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
            summary: ActivitySummary(
                durationSeconds: 600,
                meditationType: "basic-breathing"
            )
        )
    ]
}
