import Foundation

/// An exercise in the exercise library
public struct Exercise: Identifiable, Codable, Hashable, Sendable {
    public let id: String
    public var name: String
    public var weightIncrement: Double
    public var isCustom: Bool
    public let createdAt: Date
    public var updatedAt: Date

    public enum CodingKeys: String, CodingKey {
        case id
        case name
        case weightIncrement = "weight_increment"
        case isCustom = "is_custom"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    public init(
        id: String,
        name: String,
        weightIncrement: Double,
        isCustom: Bool,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.name = name
        self.weightIncrement = weightIncrement
        self.isCustom = isCustom
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - DTOs

/// Request body for POST /api/exercises
public struct CreateExerciseDTO: Encodable, Sendable {
    public let name: String
    public let weightIncrement: Double
    public let isCustom: Bool

    public enum CodingKeys: String, CodingKey {
        case name
        case weightIncrement = "weight_increment"
        case isCustom = "is_custom"
    }

    public init(name: String, weightIncrement: Double = 5.0) {
        self.name = name
        self.weightIncrement = weightIncrement
        self.isCustom = true
    }
}

/// Request body for PUT /api/exercises/:id
public struct UpdateExerciseDTO: Encodable, Sendable {
    public let name: String?
    public let weightIncrement: Double?

    public enum CodingKeys: String, CodingKey {
        case name
        case weightIncrement = "weight_increment"
    }

    public init(name: String?, weightIncrement: Double?) {
        self.name = name
        self.weightIncrement = weightIncrement
    }
}

// MARK: - Mock Data
public extension Exercise {
    static let mockExercises: [Exercise] = [
        Exercise(
            id: "mock-exercise-1",
            name: "Bench Press",
            weightIncrement: 5,
            isCustom: false,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Exercise(
            id: "mock-exercise-2",
            name: "Squat",
            weightIncrement: 5,
            isCustom: false,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Exercise(
            id: "mock-exercise-3",
            name: "Deadlift",
            weightIncrement: 5,
            isCustom: false,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Exercise(
            id: "mock-exercise-4",
            name: "Overhead Press",
            weightIncrement: 5,
            isCustom: false,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Exercise(
            id: "mock-exercise-5",
            name: "Barbell Row",
            weightIncrement: 5,
            isCustom: false,
            createdAt: Date(),
            updatedAt: Date()
        )
    ]
}
