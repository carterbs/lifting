import Foundation

/// ViewModel for the Today Dashboard
/// Manages independent loading states for each card and parallel data fetching
@MainActor
class DashboardViewModel: ObservableObject {
    // MARK: - Published State

    @Published var workout: Workout?
    @Published var latestStretchSession: StretchSession?
    @Published var latestMeditationSession: MeditationSession?

    // Independent loading states for each card
    @Published var isLoadingWorkout = false
    @Published var isLoadingStretch = false
    @Published var isLoadingMeditation = false

    // Combined loading state for pull-to-refresh
    @Published var isLoading = false

    // Individual errors for each card
    @Published var workoutError: APIError?
    @Published var stretchError: APIError?
    @Published var meditationError: APIError?

    // Legacy error property for backwards compatibility
    @Published var error: APIError?

    // MARK: - Dependencies

    private let apiClient: APIClientProtocol

    // MARK: - Initialization

    init(apiClient: APIClientProtocol = APIClient.shared) {
        self.apiClient = apiClient
    }

    // MARK: - Data Loading

    /// Load all dashboard data in parallel
    /// Each card shows its own loading state independently
    func loadDashboard() async {
        isLoading = true
        error = nil
        workoutError = nil
        stretchError = nil
        meditationError = nil

        // Load all data concurrently - each method manages its own loading state
        async let workoutTask = loadTodaysWorkout()
        async let stretchTask = loadLatestStretch()
        async let meditationTask = loadLatestMeditation()

        // Await all tasks - errors are handled individually
        await workoutTask
        await stretchTask
        await meditationTask

        isLoading = false
    }

    /// Refresh just the workout data
    func refreshWorkout() async {
        await loadTodaysWorkout()
    }

    /// Refresh just the stretch data
    func refreshStretch() async {
        await loadLatestStretch()
    }

    /// Refresh just the meditation data
    func refreshMeditation() async {
        await loadLatestMeditation()
    }

    // MARK: - Private Loading Methods

    private func loadTodaysWorkout() async {
        isLoadingWorkout = true
        defer { isLoadingWorkout = false }

        do {
            workout = try await apiClient.getTodaysWorkout()
            workoutError = nil
        } catch let apiError as APIError {
            workoutError = apiError
            error = apiError
            #if DEBUG
            print("[DashboardViewModel] Error loading today's workout: \(apiError.message)")
            #endif
        } catch {
            let apiError = APIError.network(error)
            workoutError = apiError
            self.error = apiError
            #if DEBUG
            print("[DashboardViewModel] Error loading today's workout: \(error)")
            #endif
        }
    }

    private func loadLatestStretch() async {
        isLoadingStretch = true
        defer { isLoadingStretch = false }

        do {
            latestStretchSession = try await apiClient.getLatestStretchSession()
            stretchError = nil
        } catch let apiError as APIError {
            stretchError = apiError
            #if DEBUG
            print("[DashboardViewModel] Error loading latest stretch: \(apiError.message)")
            #endif
        } catch {
            stretchError = APIError.network(error)
            #if DEBUG
            print("[DashboardViewModel] Error loading latest stretch: \(error)")
            #endif
        }
    }

    private func loadLatestMeditation() async {
        isLoadingMeditation = true
        defer { isLoadingMeditation = false }

        do {
            latestMeditationSession = try await apiClient.getLatestMeditationSession()
            meditationError = nil
        } catch let apiError as APIError {
            meditationError = apiError
            #if DEBUG
            print("[DashboardViewModel] Error loading latest meditation: \(apiError.message)")
            #endif
        } catch {
            meditationError = APIError.network(error)
            #if DEBUG
            print("[DashboardViewModel] Error loading latest meditation: \(error)")
            #endif
        }
    }

    // MARK: - Workout Actions

    /// Start today's workout
    func startWorkout() async throws {
        guard let workoutId = workout?.id else {
            throw APIError.validation("No workout to start")
        }

        do {
            workout = try await apiClient.startWorkout(id: workoutId)
        } catch let apiError as APIError {
            error = apiError
            throw apiError
        } catch {
            let apiError = APIError.network(error)
            self.error = apiError
            throw apiError
        }
    }

    /// Skip today's workout
    func skipWorkout() async throws {
        guard let workoutId = workout?.id else {
            throw APIError.validation("No workout to skip")
        }

        do {
            workout = try await apiClient.skipWorkout(id: workoutId)
        } catch let apiError as APIError {
            error = apiError
            throw apiError
        } catch {
            let apiError = APIError.network(error)
            self.error = apiError
            throw apiError
        }
    }

    // MARK: - Computed Properties

    var hasWorkoutScheduled: Bool {
        workout != nil
    }

    var canStartWorkout: Bool {
        workout?.status == .pending
    }

    var canContinueWorkout: Bool {
        workout?.status == .inProgress
    }

    var formattedLastStretchDate: String? {
        guard let date = latestStretchSession?.completedAt else { return nil }
        return formatRelativeDate(date)
    }

    var formattedLastMeditationDate: String? {
        guard let date = latestMeditationSession?.completedAt else { return nil }
        return formatRelativeDate(date)
    }

    // MARK: - Helpers

    private func formatRelativeDate(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .short
            return formatter.localizedString(for: date, relativeTo: Date())
        }
    }
}

// MARK: - Preview Support

extension DashboardViewModel {
    /// Create a view model with mock data for previews
    static var preview: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient())
        viewModel.workout = Workout.mockTodayWorkout
        viewModel.latestStretchSession = StretchSession.mockRecentSession
        viewModel.latestMeditationSession = MeditationSession.mockRecentSession
        return viewModel
    }

    /// Create a view model simulating loading state for all cards
    static var loading: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient.withDelay(2.0))
        viewModel.isLoading = true
        viewModel.isLoadingWorkout = true
        viewModel.isLoadingStretch = true
        viewModel.isLoadingMeditation = true
        return viewModel
    }

    /// Create a view model simulating loading just the workout
    static var loadingWorkout: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient())
        viewModel.isLoadingWorkout = true
        viewModel.latestStretchSession = StretchSession.mockRecentSession
        viewModel.latestMeditationSession = MeditationSession.mockRecentSession
        return viewModel
    }

    /// Create a view model simulating error state
    static var error: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient.failing())
        let networkError = APIError.network(NSError(domain: "", code: -1, userInfo: [
            NSLocalizedDescriptionKey: "Unable to connect to server"
        ]))
        viewModel.error = networkError
        viewModel.workoutError = networkError
        viewModel.stretchError = networkError
        viewModel.meditationError = networkError
        return viewModel
    }

    /// Create a view model with no data (rest day)
    static var empty: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient.empty)
        return viewModel
    }

    /// Create a view model with workout in progress
    static var inProgress: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient())
        var workout = Workout.mockTodayWorkout
        workout.status = .inProgress
        viewModel.workout = workout
        viewModel.latestStretchSession = StretchSession.mockRecentSession
        viewModel.latestMeditationSession = MeditationSession.mockRecentSession
        return viewModel
    }

    /// Create a view model with completed workout
    static var completed: DashboardViewModel {
        let viewModel = DashboardViewModel(apiClient: MockAPIClient())
        var workout = Workout.mockTodayWorkout
        workout.status = .completed
        viewModel.workout = workout
        viewModel.latestStretchSession = StretchSession.mockRecentSession
        viewModel.latestMeditationSession = MeditationSession.mockRecentSession
        return viewModel
    }
}
