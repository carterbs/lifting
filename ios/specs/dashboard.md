# Dashboard Feature

## Description

The Dashboard (also called "Today") is the home screen of the Brad OS application, providing a unified view of the user's daily activities across lifting, stretching, and meditation. The dashboard displays three activity cards that show current status and provide quick access to each activity type.

The Workout Card displays today's scheduled lifting workout with progressive status tracking. It shows different states based on whether a workout is scheduled, pending, in progress, or completed. The Stretch Card and Meditation Card track recency of the last completed session and display status messages to encourage regular practice. The Stretch Card includes visual urgency indicators when the user hasn't stretched in more than 2 days.

## Requirements

### Today Dashboard Page

```gherkin
Feature: Today Dashboard

  Scenario: Viewing the dashboard
    Given I am on the Today page
    Then I should see a "Today" heading
    And I should see the Workout card
    And I should see the Stretch card
    And I should see the Meditation card
```

### Workout Card States

```gherkin
Feature: Workout Card Display

  Scenario: Loading state
    Given the workout data is being fetched
    When I view the Workout card
    Then I should see "Loading workout..." text
    And the card should have an indigo theme

  Scenario: No workout scheduled
    Given there is no workout scheduled for today
    When I view the Workout card
    Then I should see "No workout scheduled for today." message
    And the card should have a gray background

  Scenario: Pending workout
    Given there is a workout scheduled for today
    And the workout status is "pending"
    When I view the Workout card
    Then I should see a "Ready" badge with gray color
    And I should see the workout plan day name
    And I should see "Week {N}" where N is the week number
    And I should see "{N} exercises"
    And I should see a "Start Workout" button

  Scenario: In-progress workout
    Given there is a workout scheduled for today
    And the workout status is "in_progress"
    When I view the Workout card
    Then I should see an "In Progress" badge with yellow color
    And I should see "Progress: {X}/{Y} sets"
    And I should see a "Continue" button

  Scenario: Completed workout
    Given there is a workout scheduled for today
    And the workout status is "completed"
    When I view the Workout card
    Then I should see a "Completed" badge with green color
    And I should see a "View" button

  Scenario: Navigating to workout detail
    Given there is a workout scheduled for today
    When I click any button on the Workout card
    Then I should navigate to "/lifting/workouts/{id}"
```

### Stretch Card States

```gherkin
Feature: Stretch Card Display

  Scenario: Loading state
    Given the stretch session data is being fetched
    When I view the Stretch card
    Then I should see "Loading stretch data..." text

  Scenario: No stretch sessions recorded
    Given there are no stretch sessions in history
    When I view the Stretch card
    Then I should see "No stretch sessions yet" message
    And I should see a "Stretch Now" button

  Scenario: Stretched today
    Given the last stretch session was completed today
    When I view the Stretch card
    Then I should see "Stretched today!" message
    And the card should have a teal border (not urgent)

  Scenario: Stretched yesterday
    Given the last stretch session was completed 1 day ago
    When I view the Stretch card
    Then I should see "Last stretched yesterday" message
    And the card should have a teal border (not urgent)

  Scenario: Stretched 3 or more days ago (urgent)
    Given the last stretch session was completed 3 days ago
    When I view the Stretch card
    Then I should see "3 days ago - time to stretch!" message in orange color
    And the card should have an orange border (urgent state)

  Scenario: Navigating to stretch page
    Given I am viewing the Stretch card
    When I click the "Stretch Now" button
    Then I should navigate to "/stretch"
```

### Meditation Card States

```gherkin
Feature: Meditation Card Display

  Scenario: Loading state
    Given the meditation session data is being fetched
    When I view the Meditation card
    Then I should see "Loading meditation data..." text

  Scenario: No meditation sessions recorded
    Given there are no meditation sessions in history
    When I view the Meditation card
    Then I should see "No meditation sessions yet" message
    And I should see a "Meditate" button

  Scenario: Meditated today
    Given the last meditation session was completed today
    And the session duration was 600 seconds (10 minutes)
    When I view the Meditation card
    Then I should see "Meditated today!" message
    And I should see "Last session: 10 min"

  Scenario: Meditated yesterday
    Given the last meditation session was completed 1 day ago
    When I view the Meditation card
    Then I should see "Last meditated yesterday" message

  Scenario: Meditated multiple days ago
    Given the last meditation session was completed 3 days ago
    When I view the Meditation card
    Then I should see "3 days ago" message

  Scenario: Navigating to meditation page
    Given I am viewing the Meditation card
    When I click the "Meditate" button
    Then I should navigate to "/meditation"
```

### Activities Page

```gherkin
Feature: Activities Grid Page

  Scenario: Viewing all activities
    Given I am on the Activities page
    Then I should see an "Activities" heading
    And I should see a grid of activity cards

  Scenario: Activity card for Lifting
    When I view the Lifting activity card
    Then I should see the dumbbell icon
    And I should see "Lifting" as the name
    And the card should have an indigo theme

  Scenario: Activity card for Stretch
    When I view the Stretch activity card
    Then I should see the stretch icon
    And I should see "Stretch" as the name
    And the card should have a teal theme

  Scenario: Activity card for Meditation
    When I view the Meditation activity card
    Then I should see the meditation icon
    And I should see "Meditate" as the name
    And the card should have a purple theme

  Scenario: Navigating to activity from grid
    Given I am on the Activities page
    When I click the Lifting activity card
    Then I should navigate to "/lifting"

    When I click the Stretch activity card
    Then I should navigate to "/stretch"

    When I click the Meditation activity card
    Then I should navigate to "/meditation"
```

### Activity Card Theming

```gherkin
Feature: Activity Card Visual Styling

  Scenario: Activity card color schemes
    Given an activity card has color "indigo"
    Then the background should be "rgba(99, 102, 241, 0.15)"
    And the border should be "var(--indigo-7)"
    And the icon color should be "var(--indigo-9)"

    Given an activity card has color "teal"
    Then the background should be "rgba(20, 184, 166, 0.15)"
    And the border should be "var(--teal-7)"
    And the icon color should be "var(--teal-9)"

    Given an activity card has color "purple"
    Then the background should be "rgba(168, 85, 247, 0.15)"
    And the border should be "var(--purple-7)"
    And the icon color should be "var(--purple-9)"
```

### Data Fetching

```gherkin
Feature: Dashboard Data Management

  Scenario: Fetching today's workout
    Given I load the Today page
    Then the app should query "/api/workouts/today"
    And the data should be cached with key ["workouts", "today"]

  Scenario: Fetching latest stretch session
    Given I load the Today page
    Then the app should query "/api/stretch-sessions/latest"
    And the cache should be considered stale after 5 minutes

  Scenario: Fetching latest meditation session
    Given I load the Today page
    Then the app should query "/api/meditation-sessions/latest"
    And the cache should be considered stale after 5 minutes

  Scenario: Parallel data loading
    Given I load the Today page
    Then all three card queries should execute in parallel
    And each card should show its loading state independently
```
