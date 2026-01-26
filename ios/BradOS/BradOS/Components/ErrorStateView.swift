import SwiftUI

/// A view displayed when an error occurs
struct ErrorStateView: View {
    let message: String
    let retryAction: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(Theme.textSecondary)

            Text(message)
                .font(.body)
                .foregroundColor(Theme.textSecondary)
                .multilineTextAlignment(.center)

            Button("Try Again", action: retryAction)
                .buttonStyle(SecondaryButtonStyle())
        }
        .padding(Theme.Spacing.xl)
    }
}

#Preview {
    ErrorStateView(message: "Failed to load calendar data") {}
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
        .preferredColorScheme(.dark)
}
