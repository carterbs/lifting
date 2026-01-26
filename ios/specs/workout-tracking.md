# Workout Tracking Feature

## Description

The Workout Tracking (Lifting) feature is a comprehensive progressive overload training system that enables users to create workout plans, execute 6-week mesocycles with automatic weight/rep progression, and track individual workouts with detailed set logging. The system implements a structured progression pattern where odd weeks (1, 3, 5) add 1 rep per exercise while maintaining the same weight, and even weeks (2, 4, 6) increase weight by a configurable increment (default 5 lbs) while resetting reps to the base value. Week 7 is a deload week with reduced volume (50% sets) and weight (85% of working weight) for recovery.

The feature is built on a hierarchical structure: Plans define workout templates with configured days and exercises. Users start a Mesocycle from a plan, which generates a 7-week schedule with workouts scheduled on specific dates. During workouts, users log individual sets with actual weight and reps, which are stored in localStorage for crash recovery and synced to the database upon completion. The system includes a rest timer with audio notifications, automatic weight/rep cascading when editing sets, and visual feedback for progression status.

The progressive overload logic ensures that exercises only progress to the next week's targets if all sets from the previous week were completed. If sets are incomplete, the exercise repeats the previous week's targets without progression. The deload week is special-cased to always use 85% weight and 50% sets regardless of previous week completion.

## Requirements

### Plan Management

```gherkin
Feature: Create Workout Plan

  Scenario: User creates a new plan with multiple workout days
    Given the user is on the Plans page
    When they click "Create Plan"
    And they enter plan name "Push Pull Legs"
    And they select workout days "Monday, Wednesday, Friday"
    And for Monday they add exercise "Bench Press" with 3 sets, 8 reps, 135 lbs, 90s rest
    And for Monday they add exercise "Overhead Press" with 3 sets, 10 reps, 95 lbs, 60s rest
    And for Wednesday they add exercise "Deadlift" with 3 sets, 5 reps, 225 lbs, 180s rest
    And for Friday they add exercise "Squat" with 3 sets, 8 reps, 185 lbs, 120s rest
    And they click "Create Plan"
    Then the plan "Push Pull Legs" is created with 3 workout days
    And the user is redirected to the plan detail page

  Scenario: User edits an existing plan
    Given a plan "Upper Lower" exists with 2 workout days
    When the user navigates to the plan detail page
    And they click "Edit"
    And they modify the plan name to "Upper Lower Split"
    And they add a new exercise "Pull-ups" to Tuesday
    And they click "Save"
    Then the plan is updated with the new name
    And the new exercise appears on Tuesday

  Scenario: User edits plan with active mesocycle
    Given a plan "Full Body" exists
    And a mesocycle is active using "Full Body"
    When the user clicks "Edit" on the plan
    Then a warning dialog appears stating "This plan has an active mesocycle"
    When the user clicks "Continue Editing"
    Then the edit form is displayed with a banner stating "Changes will only apply to future workouts"

  Scenario: User deletes a plan
    Given a plan "Old Routine" exists
    And no active mesocycle uses "Old Routine"
    When the user clicks "Delete"
    Then a confirmation dialog appears
    When they confirm deletion
    Then the plan is removed from the database
    And the user is redirected to the Plans page
```

### Mesocycle Management

```gherkin
Feature: Start and Manage Mesocycle

  Scenario: User starts a new mesocycle
    Given a plan "Push Pull Legs" exists with 3 workout days
    And no active mesocycle exists
    When the user navigates to the Mesocycle page
    And they select plan "Push Pull Legs" from the dropdown
    And they select start date "2024-01-08" (a Monday)
    And they click "Start Mesocycle"
    Then a mesocycle is created with status "active"
    And 21 workouts are generated (3 days/week x 7 weeks)
    And workouts are scheduled on the correct days of the week
    And each workout has sets generated with progressive overload targets
    And the user sees the mesocycle status card showing week 1

  Scenario: User views active mesocycle
    Given an active mesocycle exists for "Push Pull Legs"
    And the current date is within week 3
    When the user navigates to the Mesocycle page
    Then they see the mesocycle status card showing:
      | Field              | Value               |
      | Plan Name          | Push Pull Legs      |
      | Current Week       | 3                   |
      | Progress           | 6/21 workouts       |
    And they see 7 week cards
    And week 3 is highlighted as the current week
    And week 7 is labeled as "Deload Week"

  Scenario: User completes a mesocycle
    Given an active mesocycle exists
    And 18 of 21 workouts are completed
    When the user clicks "Complete Mesocycle"
    Then a confirmation dialog appears
    When they click "Complete Mesocycle" in the dialog
    Then the mesocycle status changes to "completed"
    And the user can start a new mesocycle

  Scenario: User cancels a mesocycle
    Given an active mesocycle exists
    When the user clicks "Cancel Mesocycle"
    And they confirm cancellation
    Then the mesocycle status changes to "cancelled"
    And the user can start a new mesocycle
```

### Workout Execution

```gherkin
Feature: Track Workout

  Scenario: User starts and tracks a scheduled workout
    Given a workout is scheduled for today with exercises:
      | Exercise       | Sets | Target Reps | Target Weight |
      | Bench Press    | 3    | 9           | 135           |
      | Overhead Press | 3    | 10          | 95            |
    And the user is on the Today page
    When they click "Start Workout"
    Then the workout status changes to "in_progress"
    And the "Start Workout" button is replaced with "Complete Workout"
    And all sets are in "pending" status

  Scenario: User logs individual sets with rest timer
    Given a workout is in progress
    And the first set of "Bench Press" is active
    When the user enters weight "135" and reps "9"
    And they check the checkbox to log the set
    Then the set status changes to "completed"
    And a rest timer starts counting up from 0:00 to 1:30 (90 seconds)
    And the next pending set becomes active
    And the actual values are saved to localStorage immediately

  Scenario: User is prompted when rest timer completes
    Given a rest timer is active with target 90 seconds
    When 90 seconds elapse
    Then an audio beep plays
    And the timer displays "Rest Complete"
    After 2 seconds
    Then the timer auto-dismisses

  Scenario: User edits weight and cascades to subsequent sets
    Given a workout is in progress with 3 pending sets for "Bench Press"
    And all sets have target weight 135 lbs
    When the user changes weight to "140" in set 1
    Then set 2 weight automatically updates to "140"
    And set 3 weight automatically updates to "140"

  Scenario: User unlogs a completed set
    Given set 2 of "Bench Press" is logged with 135 lbs x 9 reps
    When the user unchecks the checkbox
    Then the set status changes back to "pending"
    And the actual values are cleared from the database

  Scenario: User completes workout with all sets logged
    Given a workout is in progress
    And all 6 sets are logged
    When the user clicks "Complete Workout"
    Then the workout status changes to "completed"
    And completed_at timestamp is recorded
    And localStorage workout state is cleared

  Scenario: User skips an entire workout
    Given a workout is scheduled for today
    When the user clicks "Skip"
    And they confirm in the dialog
    Then the workout status changes to "skipped"
    And all pending sets change to status "skipped"

  Scenario: User adds a set during workout
    Given a workout is in progress
    And "Bench Press" has 3 sets
    When the user clicks "Add Set" on the Bench Press exercise card
    Then a 4th set is created with the same targets as set 3
    And future workouts for this exercise are also updated to 4 sets

  Scenario: User removes a set during workout
    Given a workout is in progress
    And "Bench Press" has 4 sets
    And sets 1 and 2 are logged
    And sets 3 and 4 are pending
    When the user clicks the trash icon on set 4
    Then set 4 is removed from the workout
    And future workouts for this exercise are updated to 3 sets
```

### Progressive Overload

```gherkin
Feature: Automatic Progressive Overload

  Scenario: Exercise progresses in week 1 (rep increase)
    Given a mesocycle started in week 0
    And "Bench Press" has base targets: 135 lbs, 8 reps, 3 sets
    And all sets were completed in week 0
    When week 1 workouts are generated
    Then "Bench Press" targets are: 135 lbs, 9 reps, 3 sets

  Scenario: Exercise progresses in week 2 (weight increase)
    Given "Bench Press" had targets: 135 lbs, 9 reps, 3 sets in week 1
    And all sets were completed in week 1
    When week 2 workouts are generated
    Then "Bench Press" targets are: 140 lbs, 8 reps, 3 sets

  Scenario: Exercise does not progress due to incomplete week
    Given "Bench Press" had targets: 135 lbs, 9 reps, 3 sets in week 1
    And only 2 of 3 sets were completed in week 1
    When week 2 workouts are generated
    Then "Bench Press" targets remain: 135 lbs, 9 reps, 3 sets

  Scenario: Week 7 is always deload
    Given "Bench Press" has working weight 150 lbs in week 6
    And week 6 sets were 3
    When week 7 (deload) workouts are generated
    Then "Bench Press" targets are:
      | Weight | Sets |
      | 127.5  | 2    |
    And the week card displays "Deload Week" badge
```

### Workout Recovery and State Management

```gherkin
Feature: Workout State Persistence

  Scenario: User refreshes page during workout
    Given a workout is in progress
    And sets 1, 2, 3 are logged with actual values
    And set 4 has pending edits
    When the user refreshes the browser
    Then the workout page reloads
    And sets 1, 2, 3 display as completed with stored actual values
    And set 4 displays with pending edit values

  Scenario: User closes browser and returns to workout
    Given a workout is in progress
    And 2 sets are logged in localStorage
    When the user closes the browser
    And reopens the app 1 hour later
    Then the Today page shows the in-progress workout
    And the 2 logged sets are still marked as completed

  Scenario: Workout state is cleared on completion
    Given a workout has stored state in localStorage
    When the user completes the workout
    Then localStorage entry is removed
    And no stale data remains for the next workout
```

### Rest Timer Notifications

```gherkin
Feature: Rest Timer Notifications

  Scenario: User enables notifications on first set log
    Given the user has not been asked for notification permission
    And a workout is in progress
    When the user logs their first set
    And the rest timer starts
    Then a notification permission prompt appears
    When the user clicks "Enable Notifications"
    Then browser notification permission is granted
    And a notification is scheduled for when the timer completes

  Scenario: User receives notification when timer completes
    Given notifications are enabled
    And a rest timer is active with 60 seconds remaining
    When 60 seconds elapse
    Then a push notification appears: "Rest timer complete - Bench Press Set 1"
    And an audio beep plays

  Scenario: Notification is cancelled if timer dismissed early
    Given a rest timer is active
    And a notification is scheduled for 60 seconds
    When the user clicks "Dismiss" after 30 seconds
    Then the pending notification is cancelled
```
