import Foundation

/// Available meditation durations in minutes
public enum MeditationDuration: Int, CaseIterable, Identifiable, Sendable {
    case five = 5
    case ten = 10
    case twenty = 20

    public var id: Int { rawValue }

    public var displayName: String {
        "\(rawValue) min"
    }

    public var seconds: Int {
        rawValue * 60
    }
}

/// A completed meditation session
public struct MeditationSession: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public let completedAt: Date
    public var sessionType: String
    public var plannedDurationSeconds: Int
    public var actualDurationSeconds: Int
    public var completedFully: Bool

    public init(
        id: String,
        completedAt: Date,
        sessionType: String,
        plannedDurationSeconds: Int,
        actualDurationSeconds: Int,
        completedFully: Bool
    ) {
        self.id = id
        self.completedAt = completedAt
        self.sessionType = sessionType
        self.plannedDurationSeconds = plannedDurationSeconds
        self.actualDurationSeconds = actualDurationSeconds
        self.completedFully = completedFully
    }

    public var formattedPlannedDuration: String {
        let minutes = plannedDurationSeconds / 60
        return "\(minutes) min"
    }

    public var formattedActualDuration: String {
        let minutes = actualDurationSeconds / 60
        let seconds = actualDurationSeconds % 60
        if seconds == 0 {
            return "\(minutes)m"
        }
        return "\(minutes)m \(seconds)s"
    }

    public var formattedDuration: String {
        let minutes = actualDurationSeconds / 60
        return "\(minutes) min"
    }
}

// MARK: - Mock Data
public extension MeditationSession {
    static let mockRecentSession: MeditationSession = MeditationSession(
        id: UUID().uuidString,
        completedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
        sessionType: "basic-breathing",
        plannedDurationSeconds: 600,
        actualDurationSeconds: 600,
        completedFully: true
    )
}
