import Foundation

/// Available meditation durations in minutes
enum MeditationDuration: Int, CaseIterable, Identifiable {
    case five = 5
    case ten = 10
    case twenty = 20

    var id: Int { rawValue }

    var displayName: String {
        "\(rawValue) min"
    }

    var seconds: Int {
        rawValue * 60
    }
}

/// A completed meditation session
struct MeditationSession: Identifiable, Codable, Hashable {
    let id: String
    let completedAt: Date
    var sessionType: String
    var plannedDurationSeconds: Int
    var actualDurationSeconds: Int
    var completedFully: Bool

    var formattedPlannedDuration: String {
        let minutes = plannedDurationSeconds / 60
        return "\(minutes) min"
    }

    var formattedActualDuration: String {
        let minutes = actualDurationSeconds / 60
        let seconds = actualDurationSeconds % 60
        if seconds == 0 {
            return "\(minutes)m"
        }
        return "\(minutes)m \(seconds)s"
    }
}

// MARK: - Mock Data
extension MeditationSession {
    static let mockRecentSession: MeditationSession = MeditationSession(
        id: UUID().uuidString,
        completedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
        sessionType: "basic-breathing",
        plannedDurationSeconds: 600,
        actualDurationSeconds: 600,
        completedFully: true
    )
}
