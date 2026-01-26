import Testing
import Foundation
@testable import BradOSCore

@Suite("Plan")
struct PlanTests {

    @Test("decodes from server JSON")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": 1,
            "name": "Push Pull Legs",
            "duration_weeks": 6,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-15T00:00:00Z"
        }
        """.data(using: .utf8)!

        let plan = try makeDecoder().decode(Plan.self, from: json)

        #expect(plan.id == 1)
        #expect(plan.name == "Push Pull Legs")
        #expect(plan.durationWeeks == 6)
    }

    @Test("mockPlans has valid data")
    func mockPlansHasData() {
        let plans = Plan.mockPlans
        #expect(!plans.isEmpty)
        #expect(plans.contains { $0.name == "Push Pull Legs" })
    }

    @Test("encodes and decodes roundtrip")
    func encodesDecodesRoundtrip() throws {
        let original = Plan(
            id: 99,
            name: "Test Plan",
            durationWeeks: 4,
            createdAt: Date(),
            updatedAt: Date(),
            days: nil
        )

        let data = try makeEncoder().encode(original)
        let decoded = try makeDecoder().decode(Plan.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.name == original.name)
        #expect(decoded.durationWeeks == original.durationWeeks)
    }
}

@Suite("PlanDay")
struct PlanDayTests {

    @Test("dayOfWeekName returns correct name")
    func dayOfWeekNameCorrect() {
        let monday = PlanDay(id: 1, planId: 1, dayOfWeek: 1, name: "Push", sortOrder: 0)
        #expect(monday.dayOfWeekName == "Monday")

        let friday = PlanDay(id: 2, planId: 1, dayOfWeek: 5, name: "Legs", sortOrder: 2)
        #expect(friday.dayOfWeekName == "Friday")

        let sunday = PlanDay(id: 3, planId: 1, dayOfWeek: 0, name: "Rest", sortOrder: 3)
        #expect(sunday.dayOfWeekName == "Sunday")
    }

    @Test("dayOfWeekName returns Unknown for invalid day")
    func dayOfWeekNameInvalid() {
        let invalid = PlanDay(id: 1, planId: 1, dayOfWeek: 99, name: "Invalid", sortOrder: 0)
        #expect(invalid.dayOfWeekName == "Unknown")
    }
}
