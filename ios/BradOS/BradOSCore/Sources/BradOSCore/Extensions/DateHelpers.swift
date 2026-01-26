import Foundation

public extension Date {
    /// Days since this date (negative if in future)
    func daysSince(_ calendar: Calendar = .current) -> Int {
        calendar.dateComponents([.day], from: self, to: Date()).day ?? 0
    }

    /// Whether this date is today
    func isToday(_ calendar: Calendar = .current) -> Bool {
        calendar.isDateInToday(self)
    }

    /// Whether this date is yesterday
    func isYesterday(_ calendar: Calendar = .current) -> Bool {
        calendar.isDateInYesterday(self)
    }
}
