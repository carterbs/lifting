import SwiftUI

/// Main tab navigation for global context (Today, Activities, History, Profile)
struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            TodayDashboardView()
                .tabItem {
                    Label("Today", systemImage: "house.fill")
                }
                .tag(MainTab.today)

            ActivitiesView()
                .tabItem {
                    Label("Activities", systemImage: "square.grid.2x2.fill")
                }
                .tag(MainTab.activities)

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "calendar")
                }
                .tag(MainTab.history)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(MainTab.profile)
        }
        .tint(Theme.accent)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
