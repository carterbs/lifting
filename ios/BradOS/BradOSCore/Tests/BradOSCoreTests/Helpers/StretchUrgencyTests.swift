import Testing
@testable import BradOSCore

@Suite("StretchUrgency")
struct StretchUrgencyTests {

    @Test("0 days shows stretched today")
    func zeroDays() {
        let urgency = StretchUrgency(daysSince: 0)
        #expect(urgency.message == "Stretched today!")
        #expect(urgency.isUrgent == false)
    }

    @Test("1 day shows yesterday")
    func oneDay() {
        let urgency = StretchUrgency(daysSince: 1)
        #expect(urgency.message == "Last stretched yesterday")
        #expect(urgency.isUrgent == false)
    }

    @Test("2 days is not urgent")
    func twoDays() {
        let urgency = StretchUrgency(daysSince: 2)
        #expect(urgency.message == "2 days ago")
        #expect(urgency.isUrgent == false)
    }

    @Test("3 days is urgent")
    func threeDays() {
        let urgency = StretchUrgency(daysSince: 3)
        #expect(urgency.message.contains("time to stretch"))
        #expect(urgency.isUrgent == true)
    }

    @Test("4 days is urgent")
    func fourDays() {
        let urgency = StretchUrgency(daysSince: 4)
        #expect(urgency.isUrgent == true)
        #expect(urgency.message.contains("4 days ago"))
    }

    @Test("5 days is urgent")
    func fiveDays() {
        let urgency = StretchUrgency(daysSince: 5)
        #expect(urgency.isUrgent == true)
        #expect(urgency.message.contains("5 days ago"))
    }

    @Test("7 days is urgent")
    func sevenDays() {
        let urgency = StretchUrgency(daysSince: 7)
        #expect(urgency.isUrgent == true)
        #expect(urgency.message.contains("7 days ago"))
    }

    @Test("14 days is urgent")
    func fourteenDays() {
        let urgency = StretchUrgency(daysSince: 14)
        #expect(urgency.isUrgent == true)
        #expect(urgency.message.contains("14 days ago"))
    }

    @Test("30 days is urgent")
    func thirtyDays() {
        let urgency = StretchUrgency(daysSince: 30)
        #expect(urgency.isUrgent == true)
        #expect(urgency.message.contains("30 days ago"))
    }
}
