import Testing
import Foundation
@testable import BradOSCore

@Suite("WorkoutStateManager")
struct WorkoutStateManagerTests {

    @Test("initializeForWorkout creates empty state")
    func initializeCreatesEmptyState() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)

        manager.initializeForWorkout(workoutId: "workout-123")

        #expect(manager.currentState?.workoutId == "workout-123")
        #expect(manager.currentState?.sets.isEmpty == true)
        #expect(manager.currentState?.pendingEdits.isEmpty == true)
    }

    @Test("updateSet persists set state")
    func updateSetPersistsState() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")

        manager.updateSet(setId: "set-10", reps: 8, weight: 135.0, status: .completed)

        let stored = manager.currentState?.sets["set-10"]
        #expect(stored?.actualReps == 8)
        #expect(stored?.actualWeight == 135.0)
        #expect(stored?.status == .completed)
    }

    @Test("updatePendingEdit stores edit")
    func updatePendingEditStoresEdit() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")

        manager.updatePendingEdit(setId: "set-5", weight: 140.0, reps: nil)

        let edit = manager.getPendingEdit(setId: "set-5")
        #expect(edit?.weight == 140.0)
        #expect(edit?.reps == nil)
    }

    @Test("clearState removes all data")
    func clearStateRemovesData() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")
        manager.updateSet(setId: "set-1", reps: 10, weight: 100, status: .completed)

        manager.clearState()

        #expect(manager.currentState == nil)
    }

    @Test("hasStateForWorkout returns true for matching ID")
    func hasStateForWorkoutMatching() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-42")

        #expect(manager.hasStateForWorkout(workoutId: "workout-42") == true)
        #expect(manager.hasStateForWorkout(workoutId: "workout-99") == false)
    }

    @Test("loadState returns nil for corrupted data")
    func loadStateHandlesCorruptedData() {
        let defaults = MockUserDefaults()
        defaults.set(Data("invalid json".utf8), forKey: "brad_os_workout_state")

        let manager = WorkoutStateManager(userDefaults: defaults)

        #expect(manager.currentState == nil)
    }

    @Test("saveTimerState persists timer")
    func saveTimerStatePersists() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")

        let timer = StoredTimerState(
            startedAt: Date(),
            targetSeconds: 90,
            exerciseId: "exercise-5",
            setNumber: 2
        )
        manager.saveTimerState(timer)

        let stored = manager.getTimerState()
        #expect(stored?.targetSeconds == 90)
        #expect(stored?.exerciseId == "exercise-5")
        #expect(stored?.setNumber == 2)
    }

    @Test("clearTimerState removes timer")
    func clearTimerStateRemoves() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")
        manager.saveTimerState(StoredTimerState(
            startedAt: Date(), targetSeconds: 60, exerciseId: "exercise-1", setNumber: 1
        ))

        manager.clearTimerState()

        #expect(manager.getTimerState() == nil)
    }

    @Test("state persists across manager instances")
    func statePersistsAcrossInstances() {
        let defaults = MockUserDefaults()

        // First manager saves state
        let manager1 = WorkoutStateManager(userDefaults: defaults)
        manager1.initializeForWorkout(workoutId: "workout-999")
        manager1.updateSet(setId: "set-1", reps: 12, weight: 200, status: .completed)

        // Second manager loads same state
        let manager2 = WorkoutStateManager(userDefaults: defaults)

        #expect(manager2.currentState?.workoutId == "workout-999")
        #expect(manager2.currentState?.sets["set-1"]?.actualReps == 12)
    }

    @Test("removePendingEdit removes specific edit")
    func removePendingEditRemovesSpecific() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")

        manager.updatePendingEdit(setId: "set-1", weight: 100.0, reps: 10)
        manager.updatePendingEdit(setId: "set-2", weight: 150.0, reps: 8)

        manager.removePendingEdit(setId: "set-1")

        #expect(manager.getPendingEdit(setId: "set-1") == nil)
        #expect(manager.getPendingEdit(setId: "set-2") != nil)
    }

    @Test("updatePendingEdit with both nil removes edit")
    func updatePendingEditBothNilRemoves() {
        let defaults = MockUserDefaults()
        let manager = WorkoutStateManager(userDefaults: defaults)
        manager.initializeForWorkout(workoutId: "workout-1")

        manager.updatePendingEdit(setId: "set-1", weight: 100.0, reps: 10)
        manager.updatePendingEdit(setId: "set-1", weight: nil, reps: nil)

        #expect(manager.getPendingEdit(setId: "set-1") == nil)
    }
}
