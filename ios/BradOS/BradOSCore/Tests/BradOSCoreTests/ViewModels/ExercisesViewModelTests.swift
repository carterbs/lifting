import Testing
@testable import BradOSCore

@Suite("ExercisesViewModel")
struct ExercisesViewModelTests {

    @Test("initial state is idle")
    @MainActor
    func initialStateIsIdle() {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())

        #expect(vm.exercisesState.data == nil)
        #expect(vm.exercisesState.isLoading == false)
    }

    @Test("loadExercises fetches exercises")
    @MainActor
    func loadExercisesFetches() async {
        let mock = MockAPIClient()
        mock.mockExercises = Exercise.mockExercises

        let vm = ExercisesViewModel(apiClient: mock)
        await vm.loadExercises()

        #expect(vm.exercisesState.data != nil)
        #expect(vm.exercisesState.data?.isEmpty == false)
    }

    @Test("createExercise validates empty name")
    @MainActor
    func createExerciseValidatesEmptyName() async {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())
        vm.newExerciseName = ""
        vm.newWeightIncrement = "5"

        let result = await vm.createExercise()

        #expect(result == false)
        #expect(vm.formValidationError != nil)
        #expect(vm.formValidationError?.contains("required") == true)
    }

    @Test("createExercise validates name length")
    @MainActor
    func createExerciseValidatesNameLength() async {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())
        let longName = String(repeating: "a", count: 101)
        vm.newExerciseName = longName
        vm.newWeightIncrement = "5"

        let result = await vm.createExercise()

        #expect(result == false)
        #expect(vm.formValidationError?.contains("100") == true)
    }

    @Test("createExercise validates positive weight increment")
    @MainActor
    func createExerciseValidatesPositiveIncrement() async {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())
        vm.newExerciseName = "Test"
        vm.newWeightIncrement = "0"

        let result = await vm.createExercise()

        #expect(result == false)
        #expect(vm.formValidationError?.contains("positive") == true)
    }

    @Test("createExercise validates negative weight increment")
    @MainActor
    func createExerciseValidatesNegativeIncrement() async {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())
        vm.newExerciseName = "Test"
        vm.newWeightIncrement = "-5"

        let result = await vm.createExercise()

        #expect(result == false)
        #expect(vm.formValidationError?.contains("positive") == true)
    }

    @Test("createExercise succeeds with valid data")
    @MainActor
    func createExerciseSucceeds() async {
        let mock = MockAPIClient()
        let vm = ExercisesViewModel(apiClient: mock)
        vm.newExerciseName = "New Exercise"
        vm.newWeightIncrement = "2.5"

        let result = await vm.createExercise()

        #expect(result == true)
        #expect(vm.formValidationError == nil)
    }

    @Test("createExercise clears form on success")
    @MainActor
    func createExerciseClearsForm() async {
        let mock = MockAPIClient()
        let vm = ExercisesViewModel(apiClient: mock)
        vm.newExerciseName = "Test Exercise"
        vm.newWeightIncrement = "10"

        _ = await vm.createExercise()

        #expect(vm.newExerciseName.isEmpty)
        #expect(vm.newWeightIncrement == "5")
    }

    @Test("deleteExercise removes from list")
    @MainActor
    func deleteExerciseRemoves() async {
        let mock = MockAPIClient()
        mock.mockExercises = Exercise.mockExercises

        let vm = ExercisesViewModel(apiClient: mock)
        await vm.loadExercises()

        let exerciseToDelete = mock.mockExercises.first!
        let result = await vm.deleteExercise(exerciseToDelete)

        #expect(result == true)
        #expect(vm.deleteError == nil)
    }

    @Test("exercises computed property returns data")
    @MainActor
    func exercisesComputedProperty() async {
        let mock = MockAPIClient()
        mock.mockExercises = Exercise.mockExercises

        let vm = ExercisesViewModel(apiClient: mock)
        await vm.loadExercises()

        #expect(vm.exercises.count == Exercise.mockExercises.count)
    }

    @Test("isLoading computed property reflects state")
    @MainActor
    func isLoadingComputedProperty() {
        let vm = ExercisesViewModel(apiClient: MockAPIClient())

        #expect(vm.isLoading == false)
    }
}
