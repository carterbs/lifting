import Testing
import Foundation
@testable import BradOSCore

@Suite("Workout")
struct WorkoutTests {

    @Test("decodes from server JSON with snake_case keys")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": "workout-abc123",
            "mesocycle_id": "meso-xyz789",
            "plan_day_id": "planday-def456",
            "week_number": 2,
            "scheduled_date": "2026-01-15T00:00:00Z",
            "status": "pending"
        }
        """.data(using: .utf8)!

        let decoder = makeDecoder()
        let workout = try decoder.decode(Workout.self, from: json)

        #expect(workout.id == "workout-abc123")
        #expect(workout.mesocycleId == "meso-xyz789")
        #expect(workout.planDayId == "planday-def456")
        #expect(workout.weekNumber == 2)
        #expect(workout.status == .pending)
    }

    @Test("encodes and decodes roundtrip")
    func encodesDecodesRoundtrip() throws {
        let original = Workout.mockTodayWorkout

        let encoder = makeEncoder()
        let data = try encoder.encode(original)

        let decoder = makeDecoder()
        let decoded = try decoder.decode(Workout.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.status == original.status)
    }

    @Test("statusDisplayName returns Scheduled for pending")
    func statusDisplayNamePending() {
        var workout = Workout.mockTodayWorkout
        workout.status = .pending
        #expect(workout.statusDisplayName == "Scheduled")
    }

    @Test("statusDisplayName returns In Progress for inProgress")
    func statusDisplayNameInProgress() {
        var workout = Workout.mockTodayWorkout
        workout.status = .inProgress
        #expect(workout.statusDisplayName == "In Progress")
    }

    @Test("statusDisplayName returns Completed for completed")
    func statusDisplayNameCompleted() {
        var workout = Workout.mockTodayWorkout
        workout.status = .completed
        #expect(workout.statusDisplayName == "Completed")
    }

    @Test("statusDisplayName returns Skipped for skipped")
    func statusDisplayNameSkipped() {
        var workout = Workout.mockTodayWorkout
        workout.status = .skipped
        #expect(workout.statusDisplayName == "Skipped")
    }

    @Test("decodes in_progress status correctly")
    func decodesInProgressStatus() throws {
        let json = """
        {
            "id": "workout-1",
            "mesocycle_id": "meso-1",
            "plan_day_id": "planday-1",
            "week_number": 1,
            "scheduled_date": "2026-01-15T00:00:00Z",
            "status": "in_progress"
        }
        """.data(using: .utf8)!

        let workout = try makeDecoder().decode(Workout.self, from: json)
        #expect(workout.status == .inProgress)
    }
}

@Suite("WorkoutExercise")
struct WorkoutExerciseTests {

    @Test("formattedRestTime shows seconds under 60")
    func formattedRestTimeSeconds() {
        let exercise = WorkoutExercise(
            exerciseId: "exercise-1",
            exerciseName: "Test",
            sets: [],
            totalSets: 3,
            completedSets: 0,
            restSeconds: 45
        )

        #expect(exercise.formattedRestTime == "45s")
    }

    @Test("formattedRestTime shows minutes for 60+")
    func formattedRestTimeMinutes() {
        let exercise = WorkoutExercise(
            exerciseId: "exercise-1",
            exerciseName: "Test",
            sets: [],
            totalSets: 3,
            completedSets: 0,
            restSeconds: 120
        )

        #expect(exercise.formattedRestTime == "2m")
    }

    @Test("formattedRestTime shows mixed for non-even minutes")
    func formattedRestTimeMixed() {
        let exercise = WorkoutExercise(
            exerciseId: "exercise-1",
            exerciseName: "Test",
            sets: [],
            totalSets: 3,
            completedSets: 0,
            restSeconds: 90
        )

        #expect(exercise.formattedRestTime == "1m 30s")
    }
}
