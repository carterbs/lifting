import Foundation

/// Individual stretch within a body region
struct Stretch: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let bilateral: Bool
    let image: String?
    let audioFiles: AudioFiles

    struct AudioFiles: Codable, Hashable {
        let begin: String
    }
}

/// Container for stretches in a region
struct RegionStretches: Codable {
    let stretches: [Stretch]
}

/// Shared audio files used across all stretches
struct SharedAudio: Codable {
    let switchSides: String
    let halfway: String
    let sessionComplete: String
    let silence: String
}

/// Root manifest structure matching stretches.json
struct StretchManifest: Codable {
    let regions: [String: RegionStretches]
    let shared: SharedAudio

    /// Get stretches for a specific body region
    func getStretches(for region: BodyRegion) -> [Stretch] {
        return regions[region.rawValue]?.stretches ?? []
    }

    /// Select a random stretch for a body region
    func selectRandomStretch(for region: BodyRegion) -> Stretch? {
        let stretches = getStretches(for: region)
        return stretches.randomElement()
    }
}

/// A stretch selected for a session with timing info
struct SelectedStretch: Identifiable, Codable, Hashable {
    var id: String { "\(region.rawValue)-\(stretch.id)" }
    let region: BodyRegion
    let stretch: Stretch
    let durationSeconds: Int

    /// Duration of each segment (half of total duration)
    var segmentDuration: Int {
        durationSeconds / 2
    }

    /// Number of segments (always 2)
    var totalSegments: Int {
        2
    }
}
