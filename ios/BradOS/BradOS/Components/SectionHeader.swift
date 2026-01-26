import SwiftUI

/// A section header with optional action button
struct SectionHeader: View {
    let title: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Spacer()

            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.subheadline)
                        .foregroundColor(Theme.accent)
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        SectionHeader(title: "Recent Workouts")
        SectionHeader(title: "Plans", actionTitle: "See All") {}
    }
    .padding()
    .background(Theme.background)
    .preferredColorScheme(.dark)
}
