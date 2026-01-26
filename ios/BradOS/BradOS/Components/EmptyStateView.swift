import SwiftUI

/// A view displayed when there's no content
struct EmptyStateView: View {
    let iconName: String
    let title: String
    let message: String
    var buttonTitle: String?
    var buttonAction: (() -> Void)?

    var body: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: iconName)
                .font(.system(size: 48))
                .foregroundColor(Theme.textSecondary)

            Text(title)
                .font(.headline)
                .foregroundColor(Theme.textPrimary)

            Text(message)
                .font(.subheadline)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            if let buttonTitle = buttonTitle, let buttonAction = buttonAction {
                Button(action: buttonAction) {
                    Text(buttonTitle)
                        .fontWeight(.medium)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.top, Theme.Spacing.sm)
            }
        }
        .padding(Theme.Spacing.xl)
    }
}

#Preview {
    EmptyStateView(
        iconName: "dumbbell",
        title: "No Workouts Yet",
        message: "Start a mesocycle to begin tracking your workouts.",
        buttonTitle: "Start Mesocycle"
    ) {}
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Theme.background)
    .preferredColorScheme(.dark)
}
