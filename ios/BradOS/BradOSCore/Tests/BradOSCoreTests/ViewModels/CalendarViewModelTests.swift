import Testing
import Foundation
@testable import BradOSCore

@Suite("CalendarViewModel")
struct CalendarViewModelTests {

    @Test("timezoneOffset calculates correctly")
    @MainActor
    func timezoneOffsetCalculation() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        let offset = vm.timezoneOffset

        // Should be minutes from GMT (can be positive or negative)
        #expect(offset >= -720 && offset <= 720)
    }

    @Test("loadCalendarData fetches for current month")
    @MainActor
    func loadCalendarDataFetchesCurrentMonth() async {
        let mock = MockAPIClient()
        mock.mockCalendarData = CalendarData(
            startDate: "2026-01-01",
            endDate: "2026-01-31",
            days: [:]
        )

        let vm = CalendarViewModel(apiClient: mock)
        await vm.loadCalendarData()

        #expect(vm.calendarData != nil)
        #expect(vm.isLoading == false)
    }

    @Test("navigateToNextMonth increments month")
    @MainActor
    func navigateToNextMonth() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        let initialMonth = vm.currentMonth

        vm.navigateToNextMonth()

        let expected = Calendar.current.date(byAdding: .month, value: 1, to: initialMonth)!
        #expect(Calendar.current.isDate(vm.currentMonth, equalTo: expected, toGranularity: .month))
    }

    @Test("navigateToPreviousMonth decrements month")
    @MainActor
    func navigateToPreviousMonth() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        let initialMonth = vm.currentMonth

        vm.navigateToPreviousMonth()

        let expected = Calendar.current.date(byAdding: .month, value: -1, to: initialMonth)!
        #expect(Calendar.current.isDate(vm.currentMonth, equalTo: expected, toGranularity: .month))
    }

    @Test("filter nil shows all activities")
    @MainActor
    func filterNilShowsAll() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        vm.selectedFilter = nil

        #expect(vm.shouldShowActivity(type: "workout") == true)
        #expect(vm.shouldShowActivity(type: "stretch") == true)
        #expect(vm.shouldShowActivity(type: "meditation") == true)
    }

    @Test("filter workout shows only workouts")
    @MainActor
    func filterWorkoutShowsWorkouts() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        vm.selectedFilter = "workout"

        #expect(vm.shouldShowActivity(type: "workout") == true)
        #expect(vm.shouldShowActivity(type: "stretch") == false)
        #expect(vm.shouldShowActivity(type: "meditation") == false)
    }

    @Test("filter stretch shows only stretches")
    @MainActor
    func filterStretchShowsStretches() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        vm.selectedFilter = "stretch"

        #expect(vm.shouldShowActivity(type: "workout") == false)
        #expect(vm.shouldShowActivity(type: "stretch") == true)
        #expect(vm.shouldShowActivity(type: "meditation") == false)
    }

    @Test("filter meditation shows only meditation")
    @MainActor
    func filterMeditationShowsMeditation() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        vm.selectedFilter = "meditation"

        #expect(vm.shouldShowActivity(type: "workout") == false)
        #expect(vm.shouldShowActivity(type: "stretch") == false)
        #expect(vm.shouldShowActivity(type: "meditation") == true)
    }

    @Test("activitiesForDate returns empty for no data")
    @MainActor
    func activitiesForDateEmpty() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        let activities = vm.activitiesForDate(Date())

        #expect(activities.isEmpty)
    }

    @Test("year and month are computed correctly")
    @MainActor
    func yearAndMonthComputed() {
        let vm = CalendarViewModel(apiClient: MockAPIClient())
        let calendar = Calendar.current
        let expectedYear = calendar.component(.year, from: vm.currentMonth)
        let expectedMonth = calendar.component(.month, from: vm.currentMonth)

        #expect(vm.year == expectedYear)
        #expect(vm.month == expectedMonth)
    }
}
