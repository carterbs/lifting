import Testing
import Foundation
@testable import BradOSCore

@Suite("Date+Helpers")
struct DateHelpersTests {

    @Test("daysSince returns 0 for today")
    func daysSinceToday() {
        let today = Date()
        #expect(today.daysSince() == 0)
    }

    @Test("daysSince returns 1 for yesterday")
    func daysSinceYesterday() {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        #expect(yesterday.daysSince() == 1)
    }

    @Test("daysSince returns correct value for past dates")
    func daysSincePast() {
        let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        #expect(fiveDaysAgo.daysSince() == 5)
    }

    @Test("daysSince returns negative for future dates")
    func daysSinceFuture() {
        // Use 2 days in future to avoid edge cases at day boundaries
        let future = Calendar.current.date(byAdding: .day, value: 2, to: Date())!
        #expect(future.daysSince() < 0)
    }

    @Test("isToday returns true for today")
    func isTodayTrue() {
        #expect(Date().isToday() == true)
    }

    @Test("isToday returns false for yesterday")
    func isTodayFalse() {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        #expect(yesterday.isToday() == false)
    }

    @Test("isYesterday returns true for yesterday")
    func isYesterdayTrue() {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        #expect(yesterday.isYesterday() == true)
    }

    @Test("isYesterday returns false for today")
    func isYesterdayFalseToday() {
        #expect(Date().isYesterday() == false)
    }

    @Test("isYesterday returns false for two days ago")
    func isYesterdayFalseTwoDays() {
        let twoDaysAgo = Calendar.current.date(byAdding: .day, value: -2, to: Date())!
        #expect(twoDaysAgo.isYesterday() == false)
    }
}
