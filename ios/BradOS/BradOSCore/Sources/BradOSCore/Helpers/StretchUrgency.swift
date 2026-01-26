import Foundation

/// Calculates urgency state for stretch card
public struct StretchUrgency: Sendable {
    public let message: String
    public let isUrgent: Bool

    public init(daysSince: Int) {
        switch daysSince {
        case 0:
            message = "Stretched today!"
            isUrgent = false
        case 1:
            message = "Last stretched yesterday"
            isUrgent = false
        case 2:
            message = "2 days ago"
            isUrgent = false
        default:
            message = "\(daysSince) days ago - time to stretch!"
            isUrgent = true
        }
    }
}
