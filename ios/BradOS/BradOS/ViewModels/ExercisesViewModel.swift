import Foundation
import SwiftUI

/// ViewModel for the Exercises list view
@MainActor
class ExercisesViewModel: ObservableObject {
    // MARK: - Published State

    @Published private(set) var exercisesState: LoadState<[Exercise]> = .idle
    @Published private(set) var isCreating = false
    @Published private(set) var deletingExerciseId: Int?
    @Published var createError: String?
    @Published var deleteError: String?

    // MARK: - Form State

    @Published var newExerciseName = ""
    @Published var newWeightIncrement = "5"
    @Published var formValidationError: String?

    // MARK: - Dependencies

    private let apiClient: APIClientProtocol

    init(apiClient: APIClientProtocol = APIClient.shared) {
        self.apiClient = apiClient
    }

    // MARK: - Computed

    var exercises: [Exercise] { exercisesState.data ?? [] }
    var isLoading: Bool { exercisesState.isLoading }

    // MARK: - Actions

    func loadExercises() async {
        exercisesState = .loading
        do {
            let exercises = try await apiClient.getExercises()
            exercisesState = .loaded(exercises)
        } catch {
            exercisesState = .error(error)
        }
    }

    func createExercise() async -> Bool {
        guard validateForm() else { return false }

        isCreating = true
        createError = nil

        do {
            let increment = Double(newWeightIncrement) ?? 5.0
            let newExercise = try await apiClient.createExercise(
                name: newExerciseName.trimmingCharacters(in: .whitespaces),
                weightIncrement: increment
            )

            // Append to local state
            if var current = exercisesState.data {
                current.append(newExercise)
                exercisesState = .loaded(current)
            }

            clearForm()
            isCreating = false
            return true
        } catch {
            createError = parseError(error)
            isCreating = false
            return false
        }
    }

    func deleteExercise(_ exercise: Exercise) async -> Bool {
        deletingExerciseId = exercise.id
        deleteError = nil

        do {
            try await apiClient.deleteExercise(id: exercise.id)

            // Remove from local state
            if var current = exercisesState.data {
                current.removeAll { $0.id == exercise.id }
                exercisesState = .loaded(current)
            }

            deletingExerciseId = nil
            return true
        } catch {
            deleteError = parseError(error)
            deletingExerciseId = nil
            return false
        }
    }

    // MARK: - Validation

    func validateForm() -> Bool {
        formValidationError = nil

        let trimmedName = newExerciseName.trimmingCharacters(in: .whitespaces)

        if trimmedName.isEmpty {
            formValidationError = "Exercise name is required"
            return false
        }

        if trimmedName.count > 100 {
            formValidationError = "Exercise name must be 100 characters or less"
            return false
        }

        guard let increment = Double(newWeightIncrement), increment > 0 else {
            formValidationError = "Weight increment must be a positive number"
            return false
        }

        return true
    }

    func clearForm() {
        newExerciseName = ""
        newWeightIncrement = "5"
        formValidationError = nil
        createError = nil
    }

    func clearDeleteError() {
        deleteError = nil
    }

    // MARK: - Helpers

    private func parseError(_ error: Error) -> String {
        if let apiError = error as? APIError {
            return apiError.message
        }
        return error.localizedDescription
    }
}

// MARK: - Preview Support

extension ExercisesViewModel {
    /// Create a view model with mock data for previews
    static var preview: ExercisesViewModel {
        let viewModel = ExercisesViewModel(apiClient: MockAPIClient())
        viewModel.exercisesState = .loaded(Exercise.mockExercises)
        return viewModel
    }

    /// Create a view model simulating loading state
    static var loading: ExercisesViewModel {
        let viewModel = ExercisesViewModel(apiClient: MockAPIClient.withDelay(2.0))
        viewModel.exercisesState = .loading
        return viewModel
    }

    /// Create a view model simulating error state
    static var error: ExercisesViewModel {
        let viewModel = ExercisesViewModel(apiClient: MockAPIClient.failing())
        viewModel.exercisesState = .error(APIError.network(NSError(domain: "", code: -1, userInfo: [
            NSLocalizedDescriptionKey: "Unable to connect to server"
        ])))
        return viewModel
    }

    /// Create a view model with no exercises (empty state)
    static var empty: ExercisesViewModel {
        let viewModel = ExercisesViewModel(apiClient: MockAPIClient.empty)
        viewModel.exercisesState = .loaded([])
        return viewModel
    }
}
