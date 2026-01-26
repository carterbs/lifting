import Testing
import Foundation
@testable import BradOSCore

@Suite("StretchSession")
struct StretchSessionTests {

    @Test("decodes from server JSON")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": "abc-123",
            "completedAt": "2026-01-15T10:30:00Z",
            "totalDurationSeconds": 480,
            "regionsCompleted": 8,
            "regionsSkipped": 0
        }
        """.data(using: .utf8)!

        let session = try makeDecoder().decode(StretchSession.self, from: json)

        #expect(session.id == "abc-123")
        #expect(session.totalDurationSeconds == 480)
        #expect(session.regionsCompleted == 8)
    }

    @Test("formattedDuration calculates correctly for even minutes")
    func formattedDurationEven() {
        let session = StretchSession(
            id: "1",
            completedAt: Date(),
            totalDurationSeconds: 600, // 10 minutes
            regionsCompleted: 5,
            regionsSkipped: 0,
            stretches: nil
        )

        #expect(session.formattedDuration == "10 min")
    }

    @Test("formattedDuration calculates correctly with seconds")
    func formattedDurationWithSeconds() {
        let session = StretchSession(
            id: "1",
            completedAt: Date(),
            totalDurationSeconds: 630, // 10 minutes 30 seconds
            regionsCompleted: 5,
            regionsSkipped: 0,
            stretches: nil
        )

        #expect(session.formattedDuration == "10m 30s")
    }

    @Test("mockRecentSession has valid data")
    func mockHasValidData() {
        let mock = StretchSession.mockRecentSession

        #expect(mock.id.isEmpty == false)
        #expect(mock.totalDurationSeconds > 0)
        #expect(mock.regionsCompleted > 0)
    }

    @Test("encodes and decodes roundtrip")
    func encodesDecodesRoundtrip() throws {
        let original = StretchSession(
            id: "test-session",
            completedAt: Date(),
            totalDurationSeconds: 360,
            regionsCompleted: 6,
            regionsSkipped: 2,
            stretches: nil
        )

        let data = try makeEncoder().encode(original)
        let decoded = try makeDecoder().decode(StretchSession.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.totalDurationSeconds == original.totalDurationSeconds)
        #expect(decoded.regionsCompleted == original.regionsCompleted)
    }
}

@Suite("BodyRegion")
struct BodyRegionTests {

    @Test("all cases have display names")
    func allHaveDisplayNames() {
        for region in BodyRegion.allCases {
            #expect(region.displayName.isEmpty == false)
        }
    }

    @Test("all cases have icon names")
    func allHaveIconNames() {
        for region in BodyRegion.allCases {
            #expect(region.iconName.isEmpty == false)
        }
    }

    @Test("neck displayName is correct")
    func neckDisplayName() {
        #expect(BodyRegion.neck.displayName == "Neck")
    }

    @Test("hipFlexors rawValue is snake_case")
    func hipFlexorsRawValue() {
        #expect(BodyRegion.hipFlexors.rawValue == "hip_flexors")
    }
}

@Suite("StretchSessionConfig")
struct StretchSessionConfigTests {

    @Test("defaultConfig has all regions")
    func defaultHasAllRegions() {
        let config = StretchSessionConfig.defaultConfig
        #expect(config.regions.count == BodyRegion.allCases.count)
    }

    @Test("defaultConfig regions are enabled")
    func defaultRegionsEnabled() {
        let config = StretchSessionConfig.defaultConfig
        #expect(config.regions.allSatisfy { $0.enabled })
    }

    @Test("defaultConfig regions have 60 second duration")
    func defaultRegionsDuration() {
        let config = StretchSessionConfig.defaultConfig
        #expect(config.regions.allSatisfy { $0.durationSeconds == 60 })
    }
}
