import Foundation

/// Body regions that can be stretched
enum BodyRegion: String, Codable, CaseIterable, Identifiable {
    case neck
    case shoulders
    case back
    case hipFlexors = "hip_flexors"
    case glutes
    case hamstrings
    case quads
    case calves

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .neck: return "Neck"
        case .shoulders: return "Shoulders"
        case .back: return "Back"
        case .hipFlexors: return "Hip Flexors"
        case .glutes: return "Glutes"
        case .hamstrings: return "Hamstrings"
        case .quads: return "Quads"
        case .calves: return "Calves"
        }
    }

    var iconName: String {
        switch self {
        case .neck: return "person.crop.circle"
        case .shoulders: return "figure.arms.open"
        case .back: return "figure.stand"
        case .hipFlexors: return "figure.walk"
        case .glutes: return "figure.seated.side.air.upper.body"
        case .hamstrings: return "figure.flexibility"
        case .quads: return "figure.run"
        case .calves: return "shoe"
        }
    }
}

/// Configuration for a stretch region
struct StretchRegionConfig: Codable, Hashable, Identifiable {
    var id: String { region.rawValue }
    let region: BodyRegion
    var durationSeconds: Int // 60 or 120
    var enabled: Bool
}

/// Configuration for a stretch session
struct StretchSessionConfig: Codable {
    var regions: [StretchRegionConfig]
    var spotifyPlaylistUrl: String?

    static var defaultConfig: StretchSessionConfig {
        StretchSessionConfig(
            regions: BodyRegion.allCases.map { region in
                StretchRegionConfig(region: region, durationSeconds: 60, enabled: true)
            },
            spotifyPlaylistUrl: nil
        )
    }
}

/// A completed stretch within a session
struct CompletedStretch: Identifiable, Codable, Hashable {
    var id: String { "\(region.rawValue)-\(stretchId)" }
    let region: BodyRegion
    let stretchId: String
    let stretchName: String
    let durationSeconds: Int
    var skippedSegments: Int // 0, 1, or 2
}

/// A completed stretch session
struct StretchSession: Identifiable, Codable, Hashable {
    let id: String
    let completedAt: Date
    var totalDurationSeconds: Int
    var regionsCompleted: Int
    var regionsSkipped: Int
    var stretches: [CompletedStretch]?

    // Server returns camelCase, so no CodingKeys mapping needed

    var formattedDuration: String {
        let minutes = totalDurationSeconds / 60
        let seconds = totalDurationSeconds % 60
        if seconds == 0 {
            return "\(minutes)m"
        }
        return "\(minutes)m \(seconds)s"
    }
}

// MARK: - Mock Data
extension StretchSession {
    static let mockRecentSession: StretchSession = StretchSession(
        id: UUID().uuidString,
        completedAt: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
        totalDurationSeconds: 480,
        regionsCompleted: 8,
        regionsSkipped: 0,
        stretches: nil
    )
}
