import Testing
import Foundation
@testable import BradOSCore

@Suite("MeditationSession")
struct MeditationSessionTests {

    @Test("decodes from server JSON")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": "42",
            "completedAt": "2026-01-15T10:30:00Z",
            "sessionType": "basic-breathing",
            "plannedDurationSeconds": 600,
            "actualDurationSeconds": 595,
            "completedFully": true
        }
        """.data(using: .utf8)!

        let session = try makeDecoder().decode(MeditationSession.self, from: json)

        #expect(session.id == "42")
        #expect(session.sessionType == "basic-breathing")
        #expect(session.completedFully == true)
    }

    @Test("formattedDuration shows minutes")
    func formattedDurationMinutes() {
        let session = MeditationSession(
            id: "1",
            completedAt: Date(),
            sessionType: "test",
            plannedDurationSeconds: 600,
            actualDurationSeconds: 600,
            completedFully: true
        )

        #expect(session.formattedDuration == "10 min")
    }

    @Test("formattedPlannedDuration shows minutes")
    func formattedPlannedDurationMinutes() {
        let session = MeditationSession(
            id: "1",
            completedAt: Date(),
            sessionType: "test",
            plannedDurationSeconds: 300,
            actualDurationSeconds: 300,
            completedFully: true
        )

        #expect(session.formattedPlannedDuration == "5 min")
    }

    @Test("formattedActualDuration shows even minutes")
    func formattedActualDurationEven() {
        let session = MeditationSession(
            id: "1",
            completedAt: Date(),
            sessionType: "test",
            plannedDurationSeconds: 600,
            actualDurationSeconds: 600,
            completedFully: true
        )

        #expect(session.formattedActualDuration == "10m")
    }

    @Test("formattedActualDuration shows minutes and seconds")
    func formattedActualDurationWithSeconds() {
        let session = MeditationSession(
            id: "1",
            completedAt: Date(),
            sessionType: "test",
            plannedDurationSeconds: 600,
            actualDurationSeconds: 630,
            completedFully: true
        )

        #expect(session.formattedActualDuration == "10m 30s")
    }

    @Test("mockRecentSession has valid data")
    func mockHasValidData() {
        let mock = MeditationSession.mockRecentSession

        #expect(mock.id.isEmpty == false)
        #expect(mock.plannedDurationSeconds > 0)
    }

    @Test("encodes and decodes roundtrip")
    func encodesDecodesRoundtrip() throws {
        let original = MeditationSession(
            id: "session-1",
            completedAt: Date(),
            sessionType: "guided",
            plannedDurationSeconds: 1200,
            actualDurationSeconds: 1180,
            completedFully: true
        )

        let data = try makeEncoder().encode(original)
        let decoded = try makeDecoder().decode(MeditationSession.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.sessionType == original.sessionType)
    }
}

@Suite("MeditationDuration")
struct MeditationDurationTests {

    @Test("five minutes has correct values")
    func fiveMinutes() {
        #expect(MeditationDuration.five.rawValue == 5)
        #expect(MeditationDuration.five.seconds == 300)
        #expect(MeditationDuration.five.displayName == "5 min")
    }

    @Test("ten minutes has correct values")
    func tenMinutes() {
        #expect(MeditationDuration.ten.rawValue == 10)
        #expect(MeditationDuration.ten.seconds == 600)
        #expect(MeditationDuration.ten.displayName == "10 min")
    }

    @Test("twenty minutes has correct values")
    func twentyMinutes() {
        #expect(MeditationDuration.twenty.rawValue == 20)
        #expect(MeditationDuration.twenty.seconds == 1200)
        #expect(MeditationDuration.twenty.displayName == "20 min")
    }

    @Test("all cases have unique IDs")
    func allCasesUniqueIds() {
        let ids = MeditationDuration.allCases.map { $0.id }
        let uniqueIds = Set(ids)
        #expect(ids.count == uniqueIds.count)
    }
}
