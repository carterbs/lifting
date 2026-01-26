# Profile & Settings Feature

## Description

The Profile & Settings feature provides users with a unified view of their fitness activity statistics and notification settings. This page serves as the central hub for viewing workout and meditation progress, managing push notification preferences, and understanding PWA installation status.

The feature displays key activity metrics including completed mesocycles, total mesocycles, meditation sessions, and total meditation time. The notification settings section handles browser notification permissions, push subscription management, and PWA installation detection. It provides intelligent guidance based on the user's device (iOS vs. other platforms), installation status (standalone PWA vs. browser), and notification permission state.

## Requirements

### Activity Statistics Display

```gherkin
Feature: Activity Statistics Display

  Scenario: Viewing activity stats with no data
    Given the user has no mesocycles
    And the user has no meditation sessions
    When the user navigates to the Profile page
    Then the "Mesocycles Completed" stat shows 0
    And the "Total Mesocycles" stat shows 0
    And the "Meditation Sessions" stat shows 0
    And the "Total Meditation Time" stat shows "0 min"

  Scenario: Viewing activity stats with workout data
    Given the user has 3 total mesocycles
    And 2 mesocycles have status "completed"
    When the user navigates to the Profile page
    Then the "Mesocycles Completed" stat shows 2
    And the "Total Mesocycles" stat shows 3

  Scenario: Viewing activity stats with meditation data
    Given the user has completed 15 meditation sessions
    And the total meditation time is 180 minutes
    When the user navigates to the Profile page
    Then the "Meditation Sessions" stat shows 15
    And the "Total Meditation Time" stat shows "180 min"
```

### Notification Permission Management

```gherkin
Feature: Notification Permission Management

  Scenario: Initial notification state (default permission)
    Given the browser supports notifications
    And the notification permission is "default"
    When the user navigates to the Profile page
    Then the notification status shows "Notifications not set up"
    And the status icon is yellow (warning)
    And an "Enable Notifications" button is visible

  Scenario: Successfully enabling notifications
    Given the notification permission is "default"
    When the user clicks "Enable Notifications"
    And the user grants notification permission
    Then the notification permission becomes "granted"
    And the push subscription is saved to localStorage
    And the notification status shows "Notifications enabled"
    And the status icon is green (enabled)
    And a "Send Test Notification" button is visible

  Scenario: Enabling notifications when VAPID setup fails
    Given the notification permission is "default"
    When the user clicks "Enable Notifications"
    And the user grants notification permission
    But the VAPID key fetch fails
    Then local notifications will still work

  Scenario: Notification permission denied
    Given the notification permission is "denied"
    When the user navigates to the Profile page
    Then the notification status shows "Notifications blocked"
    And the status icon is red (error)
    And a callout with recovery instructions is displayed

  Scenario: Unsupported browser
    Given the browser does not support notifications
    When the user navigates to the Profile page
    Then no notification settings are displayed
```

### Push Subscription Management

```gherkin
Feature: Push Subscription Management

  Scenario: Creating push subscription
    Given notification permission is "granted"
    And the VAPID public key is available
    When initializeNotifications is called
    Then a push subscription is created via service worker
    And the subscription is saved to localStorage

  Scenario: Loading existing subscription from storage
    Given a push subscription exists in localStorage
    When scheduleTimerNotification is called
    Then the subscription is loaded from localStorage

  Scenario: Handling missing subscription
    Given no push subscription exists
    When scheduleTimerNotification is called
    Then an error is thrown with message "No push subscription available"
```

### Test Notification Flow

```gherkin
Feature: Test Notification Sending

  Scenario: Sending test notification with push subscription
    Given notification permission is "granted"
    And a push subscription exists
    When the user clicks "Send Test Notification"
    Then a local notification is scheduled for 5 seconds
    And a push notification is scheduled via API for 5 seconds
    And a green callout shows "Test notification scheduled!"

  Scenario: Sending test notification without push subscription
    Given notification permission is "granted"
    But no push subscription exists
    When the user clicks "Send Test Notification"
    Then a local notification is scheduled for 5 seconds
    And the push notification scheduling is skipped

  Scenario: Test notification failure
    Given notification permission is "granted"
    When the user clicks "Send Test Notification"
    But the API request fails
    Then the error message is displayed in a red callout
```

### PWA Installation Detection

```gherkin
Feature: PWA Installation Detection

  Scenario: Detecting iOS Safari (not installed)
    Given the user is on an iOS device
    And the app is running in Safari browser
    And not in standalone mode
    When the user navigates to the Profile page
    Then a blue info callout is displayed
    And the callout title says "Install for Lock Screen Notifications"
    And step-by-step installation instructions are shown

  Scenario: Detecting installed PWA
    Given the user is on an iOS device
    And the app is running in standalone mode
    When the user navigates to the Profile page
    Then no installation banner is shown

  Scenario: Detecting non-iOS device
    Given the user is on a non-iOS device
    When the user navigates to the Profile page
    Then no installation banner is shown
```

### Notification Prompt Dialog

```gherkin
Feature: Notification Prompt Dialog

  Scenario: Displaying notification prompt
    Given the notification prompt is opened
    When the dialog is rendered
    Then the title shows "Enable Rest Timer Notifications?"
    And a "Not Now" button is visible
    And an "Enable Notifications" button is visible

  Scenario: Enabling notifications from prompt
    Given the notification prompt is open
    When the user clicks "Enable Notifications"
    And the user grants permission
    Then the onEnabled callback is called
    And the dialog closes

  Scenario: Permission denied in prompt
    Given the notification prompt is open
    When the user clicks "Enable Notifications"
    And the user denies permission
    Then an error message is displayed in the dialog
    And the dialog remains open

  Scenario: Closing prompt without enabling
    Given the notification prompt is open
    When the user clicks "Not Now"
    Then the onClose callback is called
    And no permission request is made
```

### Notification Error Display

```gherkin
Feature: Notification Error Display

  Scenario: Displaying notification error
    Given an error message exists
    When the NotificationError component renders
    Then a red banner appears at the top of the screen
    And a dismiss button is visible

  Scenario: Auto-dismissing error after timeout
    Given an error is displayed
    When 10 seconds elapse
    Then the onDismiss callback is called

  Scenario: Manually dismissing error
    Given an error is displayed
    When the user clicks the dismiss button
    Then the onDismiss callback is called immediately

  Scenario: No error to display
    Given the error prop is null
    When the NotificationError component renders
    Then nothing is rendered
```

### Timer Notification Scheduling

```gherkin
Feature: Timer Notification Scheduling

  Scenario: Scheduling notification via push API
    Given notification permission is "granted"
    And a push subscription exists
    When scheduleTimerNotification is called with delayMs=120000, exercise="Bench Press", set=3
    Then a POST request is sent to "/api/notifications/schedule"
    And the request body includes the subscription
    And the request body includes delayMs: 120000
    And the request body includes title: "Rest Complete"
    And the request body includes body: "Time for Bench Press - Set 3"
    And the request body includes tag: "rest-timer"

  Scenario: Cancelling scheduled notification
    Given a notification is scheduled
    When cancelTimerNotification is called
    Then a POST request is sent to "/api/notifications/cancel"
    And the request body includes tag: "rest-timer"

  Scenario: Scheduling local notification
    Given notification permission is "granted"
    When scheduleLocalNotification is called
    Then a setTimeout is created for the delay
    And when the timeout fires, the service worker shows a notification

  Scenario: Cancelling local notification
    Given a local notification is scheduled
    When cancelLocalNotification is called
    Then the setTimeout is cleared
```

### Permission State Monitoring

```gherkin
Feature: Permission State Monitoring

  Scenario: Detecting permission changes on window focus
    Given notification permission is "default"
    And the user has left the app
    When the user grants permission in system settings
    And the user returns to the app (window focus event)
    Then useNotificationPermission refetches the permission
    And the permission state updates to "granted"

  Scenario: Permission state derived properties
    Given notification permission is "granted"
    When useNotificationPermission returns the state
    Then isSupported is true
    And isGranted is true
    And canRequest is false
    And isDenied is false

  Scenario: Unsupported notifications
    Given the browser does not support notifications
    When useNotificationPermission initializes
    Then permission is "unsupported"
    And isSupported is false
```

### Settings Component Status Logic

```gherkin
Feature: Settings Component Status Logic

  Scenario: Status icon selection (denied)
    Given notification permission is "denied"
    Then the status type is "error"
    And a red cross icon is displayed

  Scenario: Status icon selection (not installed)
    Given notification permission is "granted"
    But the PWA is not installed on iOS
    Then the status type is "warning"
    And a yellow warning icon is displayed

  Scenario: Status icon selection (enabled)
    Given notification permission is "granted"
    And the PWA is installed OR not on iOS
    Then the status type is "enabled"
    And a green check icon is displayed

  Scenario: Status text selection (denied)
    Given notification permission is "denied"
    Then the text is "Notifications blocked"

  Scenario: Status text selection (not installed on iOS)
    Given the user is on iOS
    And the PWA is not installed
    Then the text is "Not installed as app"

  Scenario: Status text selection (enabled)
    Given notification permission is "granted"
    Then the text is "Notifications enabled"
```

### About Section

```gherkin
Feature: About Section

  Scenario: Viewing app information
    Given the user is on the Profile page
    When the About section is rendered
    Then the version shows "Version 1.0.0"
    And the description shows "A personal fitness tracking app for lifting, stretching, and meditation."
```
