import Testing
import Foundation
@testable import BradOSCore

@Suite("Exercise")
struct ExerciseTests {

    @Test("decodes from server JSON")
    func decodesFromServerJSON() throws {
        let json = """
        {
            "id": 1,
            "name": "Bench Press",
            "weight_increment": 5.0,
            "is_custom": true,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-15T00:00:00Z"
        }
        """.data(using: .utf8)!

        let exercise = try makeDecoder().decode(Exercise.self, from: json)

        #expect(exercise.id == 1)
        #expect(exercise.name == "Bench Press")
        #expect(exercise.weightIncrement == 5.0)
        #expect(exercise.isCustom == true)
    }

    @Test("mockExercises contains expected data")
    func mockExercisesHasData() {
        let exercises = Exercise.mockExercises
        #expect(!exercises.isEmpty)
        #expect(exercises.contains { $0.name == "Bench Press" })
    }

    @Test("encodes and decodes roundtrip")
    func encodesDecodesRoundtrip() throws {
        let original = Exercise(
            id: 99,
            name: "Test Exercise",
            weightIncrement: 2.5,
            isCustom: true,
            createdAt: Date(),
            updatedAt: Date()
        )

        let data = try makeEncoder().encode(original)
        let decoded = try makeDecoder().decode(Exercise.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.name == original.name)
        #expect(decoded.weightIncrement == original.weightIncrement)
    }

    @Test("decodes exercise with optional weight_increment")
    func decodesWithDefaultWeightIncrement() throws {
        let json = """
        {
            "id": 1,
            "name": "Squat",
            "weight_increment": 10.0,
            "is_custom": false,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-15T00:00:00Z"
        }
        """.data(using: .utf8)!

        let exercise = try makeDecoder().decode(Exercise.self, from: json)
        #expect(exercise.weightIncrement == 10.0)
    }
}
