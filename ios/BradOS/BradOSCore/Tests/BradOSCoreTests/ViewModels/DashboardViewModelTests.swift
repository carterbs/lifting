import Testing
@testable import BradOSCore

@Suite("DashboardViewModel")
struct DashboardViewModelTests {

    // MARK: - Loading States

    @Test("initial state has no data")
    @MainActor
    func initialStateHasNoData() {
        let vm = DashboardViewModel(apiClient: MockAPIClient.empty)

        #expect(vm.workout == nil)
        #expect(vm.latestStretchSession == nil)
        #expect(vm.latestMeditationSession == nil)
        #expect(vm.isLoading == false)
    }

    @Test("loadDashboard fetches all data")
    @MainActor
    func loadDashboardFetchesAllData() async {
        let mock = MockAPIClient()
        mock.mockWorkout = Workout.mockTodayWorkout
        mock.mockStretchSession = StretchSession.mockRecentSession
        mock.mockMeditationSession = MeditationSession.mockRecentSession

        let vm = DashboardViewModel(apiClient: mock)
        await vm.loadDashboard()

        #expect(vm.workout != nil)
        #expect(vm.latestStretchSession != nil)
        #expect(vm.latestMeditationSession != nil)
        #expect(vm.isLoading == false)
    }

    @Test("loadDashboard handles API error")
    @MainActor
    func loadDashboardHandlesError() async {
        let mock = MockAPIClient.failing(with: .network(NSError(domain: "", code: -1)))

        let vm = DashboardViewModel(apiClient: mock)
        await vm.loadDashboard()

        #expect(vm.workoutError != nil)
        #expect(vm.isLoading == false)
    }

    @Test("individual card errors are independent")
    @MainActor
    func individualCardErrorsIndependent() async {
        let mock = MockAPIClient()
        mock.mockWorkout = nil
        mock.mockStretchSession = StretchSession.mockRecentSession
        mock.mockMeditationSession = MeditationSession.mockRecentSession

        let vm = DashboardViewModel(apiClient: mock)
        await vm.loadDashboard()

        // Workout is nil but not an error
        #expect(vm.workout == nil)
        #expect(vm.latestStretchSession != nil)
        #expect(vm.latestMeditationSession != nil)
    }

    // MARK: - Computed Properties

    @Test("hasWorkoutScheduled is true when workout exists")
    @MainActor
    func hasWorkoutScheduledTrue() {
        let vm = DashboardViewModel(apiClient: MockAPIClient())
        vm.workout = Workout.mockTodayWorkout

        #expect(vm.hasWorkoutScheduled == true)
    }

    @Test("hasWorkoutScheduled is false when no workout")
    @MainActor
    func hasWorkoutScheduledFalse() {
        let vm = DashboardViewModel(apiClient: MockAPIClient())

        #expect(vm.hasWorkoutScheduled == false)
    }

    @Test("canStartWorkout is true when status is pending")
    @MainActor
    func canStartWorkoutPending() {
        let vm = DashboardViewModel(apiClient: MockAPIClient())
        var workout = Workout.mockTodayWorkout
        workout.status = .pending
        vm.workout = workout

        #expect(vm.canStartWorkout == true)
    }

    @Test("canStartWorkout is false when status is in_progress")
    @MainActor
    func canStartWorkoutInProgress() {
        let vm = DashboardViewModel(apiClient: MockAPIClient())
        var workout = Workout.mockTodayWorkout
        workout.status = .inProgress
        vm.workout = workout

        #expect(vm.canStartWorkout == false)
    }

    @Test("canContinueWorkout is true when status is in_progress")
    @MainActor
    func canContinueWorkoutInProgress() {
        let vm = DashboardViewModel(apiClient: MockAPIClient())
        var workout = Workout.mockTodayWorkout
        workout.status = .inProgress
        vm.workout = workout

        #expect(vm.canContinueWorkout == true)
    }

    // MARK: - Actions

    @Test("startWorkout throws when no workout")
    @MainActor
    func startWorkoutThrowsWhenNoWorkout() async {
        let vm = DashboardViewModel(apiClient: MockAPIClient())

        await #expect(throws: APIError.self) {
            try await vm.startWorkout()
        }
    }

    @Test("startWorkout updates workout status")
    @MainActor
    func startWorkoutUpdatesStatus() async throws {
        let mock = MockAPIClient()
        var workout = Workout.mockTodayWorkout
        workout.status = .pending
        mock.mockWorkout = workout

        let vm = DashboardViewModel(apiClient: mock)
        vm.workout = workout

        try await vm.startWorkout()

        #expect(vm.workout?.status == .inProgress)
    }

    @Test("skipWorkout throws when no workout")
    @MainActor
    func skipWorkoutThrowsWhenNoWorkout() async {
        let vm = DashboardViewModel(apiClient: MockAPIClient())

        await #expect(throws: APIError.self) {
            try await vm.skipWorkout()
        }
    }

    @Test("skipWorkout updates workout status")
    @MainActor
    func skipWorkoutUpdatesStatus() async throws {
        let mock = MockAPIClient()
        var workout = Workout.mockTodayWorkout
        workout.status = .pending
        mock.mockWorkout = workout

        let vm = DashboardViewModel(apiClient: mock)
        vm.workout = workout

        try await vm.skipWorkout()

        #expect(vm.workout?.status == .skipped)
    }
}
