import Foundation

// MARK: - Stored State Types

/// Persisted workout state for crash recovery
public struct StoredWorkoutState: Codable, Sendable {
    public let workoutId: Int
    public var sets: [Int: StoredSetState]  // setId -> state
    public var pendingEdits: [Int: PendingEdit]  // setId -> uncommitted edits
    public var lastUpdated: Date
    public var activeTimer: StoredTimerState?

    public init(
        workoutId: Int,
        sets: [Int: StoredSetState] = [:],
        pendingEdits: [Int: PendingEdit] = [:],
        lastUpdated: Date = Date(),
        activeTimer: StoredTimerState? = nil
    ) {
        self.workoutId = workoutId
        self.sets = sets
        self.pendingEdits = pendingEdits
        self.lastUpdated = lastUpdated
        self.activeTimer = activeTimer
    }
}

/// Persisted state for a logged set
public struct StoredSetState: Codable, Sendable {
    public let actualReps: Int
    public let actualWeight: Double
    public let status: SetStatus

    public init(actualReps: Int, actualWeight: Double, status: SetStatus) {
        self.actualReps = actualReps
        self.actualWeight = actualWeight
        self.status = status
    }
}

/// Uncommitted edits to a set (before logging)
public struct PendingEdit: Codable, Sendable {
    public var weight: Double?
    public var reps: Int?

    public init(weight: Double? = nil, reps: Int? = nil) {
        self.weight = weight
        self.reps = reps
    }
}

/// Persisted rest timer state for recovery
public struct StoredTimerState: Codable, Sendable {
    public let startedAt: Date
    public let targetSeconds: Int
    public let exerciseId: Int
    public let setNumber: Int

    public init(startedAt: Date, targetSeconds: Int, exerciseId: Int, setNumber: Int) {
        self.startedAt = startedAt
        self.targetSeconds = targetSeconds
        self.exerciseId = exerciseId
        self.setNumber = setNumber
    }
}

// MARK: - Workout State Manager

/// Manages in-progress workout state persistence using UserDefaults
/// Enables crash recovery and state synchronization
public final class WorkoutStateManager: ObservableObject {
    // MARK: - Published State

    @Published public private(set) var currentState: StoredWorkoutState?

    // MARK: - Constants

    private let storageKey = "brad_os_workout_state"
    private let userDefaults: UserDefaultsProtocol

    // MARK: - Initialization

    public init(userDefaults: UserDefaultsProtocol = UserDefaults.standard) {
        self.userDefaults = userDefaults
        self.currentState = loadState()
    }

    // MARK: - State Management

    /// Save the entire workout state
    public func saveState(_ state: StoredWorkoutState) {
        currentState = state
        persistState(state)
    }

    /// Load the stored workout state (nil if none exists)
    public func loadState() -> StoredWorkoutState? {
        guard let data = userDefaults.data(forKey: storageKey) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(StoredWorkoutState.self, from: data)
        } catch {
            #if DEBUG
            print("[WorkoutStateManager] Failed to decode state: \(error)")
            #endif
            // Clear corrupted state
            clearState()
            return nil
        }
    }

    /// Clear all stored state
    public func clearState() {
        currentState = nil
        userDefaults.removeObject(forKey: storageKey)
    }

    // MARK: - Set State Updates

    /// Update the state for a specific set
    public func updateSet(setId: Int, reps: Int, weight: Double, status: SetStatus) {
        guard var state = currentState else { return }

        state.sets[setId] = StoredSetState(
            actualReps: reps,
            actualWeight: weight,
            status: status
        )
        state.lastUpdated = Date()

        saveState(state)
    }

    /// Update pending edits for a set (before logging)
    public func updatePendingEdit(setId: Int, weight: Double?, reps: Int?) {
        guard var state = currentState else { return }

        if weight == nil && reps == nil {
            state.pendingEdits.removeValue(forKey: setId)
        } else {
            state.pendingEdits[setId] = PendingEdit(weight: weight, reps: reps)
        }
        state.lastUpdated = Date()

        saveState(state)
    }

    /// Get pending edits for a specific set
    public func getPendingEdit(setId: Int) -> PendingEdit? {
        currentState?.pendingEdits[setId]
    }

    /// Remove a pending edit
    public func removePendingEdit(setId: Int) {
        guard var state = currentState else { return }
        state.pendingEdits.removeValue(forKey: setId)
        state.lastUpdated = Date()
        saveState(state)
    }

    // MARK: - Timer State

    /// Save active rest timer state
    public func saveTimerState(_ timer: StoredTimerState) {
        guard var state = currentState else { return }
        state.activeTimer = timer
        state.lastUpdated = Date()
        saveState(state)
    }

    /// Clear the active timer state
    public func clearTimerState() {
        guard var state = currentState else { return }
        state.activeTimer = nil
        state.lastUpdated = Date()
        saveState(state)
    }

    /// Get the active timer state if any
    public func getTimerState() -> StoredTimerState? {
        currentState?.activeTimer
    }

    // MARK: - Initialization for New Workout

    /// Initialize state for a new workout
    public func initializeForWorkout(workoutId: Int) {
        let state = StoredWorkoutState(
            workoutId: workoutId,
            sets: [:],
            pendingEdits: [:],
            lastUpdated: Date(),
            activeTimer: nil
        )
        saveState(state)
    }

    /// Check if stored state matches a workout ID
    public func hasStateForWorkout(workoutId: Int) -> Bool {
        currentState?.workoutId == workoutId
    }

    // MARK: - Private Helpers

    private func persistState(_ state: StoredWorkoutState) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(state)
            userDefaults.set(data, forKey: storageKey)
        } catch {
            #if DEBUG
            print("[WorkoutStateManager] Failed to encode state: \(error)")
            #endif
        }
    }
}

// MARK: - Result Types for API Responses

/// Result from adding or removing sets
/// Note: Server returns camelCase JSON, so no CodingKeys needed (Swift uses property names)
public struct ModifySetCountResult: Codable, Sendable {
    public let currentWorkoutSet: WorkoutSet?
    public let futureWorkoutsAffected: Int
    public let futureSetsModified: Int

    public init(currentWorkoutSet: WorkoutSet?, futureWorkoutsAffected: Int, futureSetsModified: Int) {
        self.currentWorkoutSet = currentWorkoutSet
        self.futureWorkoutsAffected = futureWorkoutsAffected
        self.futureSetsModified = futureSetsModified
    }
}
