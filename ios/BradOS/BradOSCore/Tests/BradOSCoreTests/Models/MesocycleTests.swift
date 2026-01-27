import Testing
import Foundation
@testable import BradOSCore

@Suite("Mesocycle")
struct MesocycleTests {

    @Test("decodes from server JSON")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": "meso-abc123",
            "plan_id": "plan-xyz789",
            "start_date": "2026-01-15T00:00:00Z",
            "current_week": 3,
            "status": "active",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-15T00:00:00Z"
        }
        """.data(using: .utf8)!

        let mesocycle = try makeDecoder().decode(Mesocycle.self, from: json)

        #expect(mesocycle.id == "meso-abc123")
        #expect(mesocycle.planId == "plan-xyz789")
        #expect(mesocycle.currentWeek == 3)
        #expect(mesocycle.status == .active)
    }

    @Test("isDeloadWeek returns true for week 7")
    func isDeloadWeekTrue() {
        var mesocycle = Mesocycle.mockActiveMesocycle
        mesocycle.currentWeek = 7
        #expect(mesocycle.isDeloadWeek == true)
    }

    @Test("isDeloadWeek returns false for other weeks")
    func isDeloadWeekFalse() {
        var mesocycle = Mesocycle.mockActiveMesocycle
        mesocycle.currentWeek = 3
        #expect(mesocycle.isDeloadWeek == false)
    }

    @Test("progressPercentage calculates correctly")
    func progressPercentageCalculation() {
        var mesocycle = Mesocycle.mockActiveMesocycle
        mesocycle.totalWorkouts = 21
        mesocycle.completedWorkouts = 7

        let expected = 7.0 / 21.0
        #expect(abs(mesocycle.progressPercentage - expected) < 0.001)
    }

    @Test("progressPercentage returns 0 for nil values")
    func progressPercentageNil() {
        var mesocycle = Mesocycle.mockActiveMesocycle
        mesocycle.totalWorkouts = nil
        mesocycle.completedWorkouts = nil

        #expect(mesocycle.progressPercentage == 0)
    }

    @Test("mockActiveMesocycle has valid data")
    func mockActiveHasValidData() {
        let mock = Mesocycle.mockActiveMesocycle

        #expect(mock.status == .active)
        #expect(mock.planName != nil)
    }

    @Test("mockCompletedMesocycles has valid data")
    func mockCompletedHasValidData() {
        let mocks = Mesocycle.mockCompletedMesocycles

        #expect(!mocks.isEmpty)
        #expect(mocks.allSatisfy { $0.status == .completed })
    }
}

@Suite("MesocycleStatus")
struct MesocycleStatusTests {

    @Test("all statuses have raw values")
    func allStatusesHaveRawValues() {
        #expect(MesocycleStatus.pending.rawValue == "pending")
        #expect(MesocycleStatus.active.rawValue == "active")
        #expect(MesocycleStatus.completed.rawValue == "completed")
        #expect(MesocycleStatus.cancelled.rawValue == "cancelled")
    }
}

@Suite("WeekSummary")
struct WeekSummaryTests {

    @Test("isComplete returns true when all workouts done")
    func isCompleteTrue() {
        let summary = WeekSummary(
            weekNumber: 1,
            workouts: [
                WorkoutSummary(id: "workout-1", scheduledDate: Date(), status: .completed, planDayName: "Day 1"),
                WorkoutSummary(id: "workout-2", scheduledDate: Date(), status: .skipped, planDayName: "Day 2")
            ],
            isDeload: false
        )

        #expect(summary.isComplete == true)
    }

    @Test("isComplete returns false when pending workouts exist")
    func isCompleteFalse() {
        let summary = WeekSummary(
            weekNumber: 1,
            workouts: [
                WorkoutSummary(id: "workout-1", scheduledDate: Date(), status: .completed, planDayName: "Day 1"),
                WorkoutSummary(id: "workout-2", scheduledDate: Date(), status: .pending, planDayName: "Day 2")
            ],
            isDeload: false
        )

        #expect(summary.isComplete == false)
    }
}
