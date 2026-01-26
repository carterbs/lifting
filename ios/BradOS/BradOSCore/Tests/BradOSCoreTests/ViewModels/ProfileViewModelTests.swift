import Testing
@testable import BradOSCore

@Suite("ProfileViewModel")
struct ProfileViewModelTests {

    @Test("loadStats fetches mesocycles and meditation stats")
    @MainActor
    func loadStatsFetches() async {
        let mock = MockAPIClient()
        mock.mockMesocycles = [Mesocycle.mockActiveMesocycle] + Mesocycle.mockCompletedMesocycles
        mock.mockMeditationStats = MeditationStats.mockStats

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        #expect(vm.isLoading == false)
        #expect(vm.totalMesocycles > 0)
    }

    @Test("mesocyclesCompleted counts only completed status")
    @MainActor
    func mesocyclesCompletedCounts() async {
        let mock = MockAPIClient()
        mock.mockMesocycles = Mesocycle.mockCompletedMesocycles

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        let expectedCompleted = mock.mockMesocycles.filter { $0.status == .completed }.count
        #expect(vm.mesocyclesCompleted == expectedCompleted)
    }

    @Test("meditation minutes calculated from stats")
    @MainActor
    func meditationMinutesCalculated() async {
        let mock = MockAPIClient()
        mock.mockMeditationStats = MeditationStats(
            totalSessions: 10,
            totalMinutes: 60
        )

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        #expect(vm.meditationMinutes == 60)
    }

    @Test("error state is set on API failure")
    @MainActor
    func errorStateOnFailure() async {
        let mock = MockAPIClient.failing()

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        #expect(vm.error != nil)
    }

    @Test("initial state has zero values")
    @MainActor
    func initialStateZeros() {
        let vm = ProfileViewModel(apiClient: MockAPIClient())

        #expect(vm.mesocyclesCompleted == 0)
        #expect(vm.totalMesocycles == 0)
        #expect(vm.meditationSessions == 0)
        #expect(vm.meditationMinutes == 0)
    }

    @Test("loadStats resets error before fetching")
    @MainActor
    func loadStatsResetsError() async {
        let mock = MockAPIClient()
        let vm = ProfileViewModel(apiClient: mock)
        vm.error = "Previous error"

        await vm.loadStats()

        // Error should be nil if fetch succeeded
        #expect(vm.error == nil)
    }

    @Test("meditation sessions populated from stats")
    @MainActor
    func meditationSessionsPopulated() async {
        let mock = MockAPIClient()
        mock.mockMeditationStats = MeditationStats(
            totalSessions: 42,
            totalMinutes: 315
        )

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        #expect(vm.meditationSessions == 42)
    }

    @Test("totalMesocycles includes all statuses")
    @MainActor
    func totalMesocyclesIncludesAll() async {
        let mock = MockAPIClient()
        mock.mockMesocycles = [Mesocycle.mockActiveMesocycle] + Mesocycle.mockCompletedMesocycles

        let vm = ProfileViewModel(apiClient: mock)
        await vm.loadStats()

        #expect(vm.totalMesocycles == mock.mockMesocycles.count)
    }
}
