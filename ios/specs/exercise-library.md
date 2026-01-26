# Exercise Library Feature

## Description

The Exercise Library is a comprehensive exercise management system that allows users to create, view, edit, and delete custom exercises for use in workout plans. Each exercise has a name and a configurable weight increment value that determines how much weight is added during progressive overload cycles (default 5 lbs).

The feature consists of two main pages: the Exercise Library page (`/lifting/exercises`) where users browse and manage all exercises, and the Exercise History page (`/lifting/exercises/:id/history`) where users view detailed workout history for a specific exercise including weight progression charts and set-by-set tracking.

Exercises can only be deleted if they are not currently used in any workout plan, preventing data integrity issues.

## Requirements

### Exercise Library Management

```gherkin
Feature: Browse Exercise Library

  Scenario: View empty exercise library
    Given I am on the exercise library page
    And no exercises exist in the database
    Then I should see a message "No exercises found. Add your first exercise above!"
    And I should see the add exercise form

  Scenario: View populated exercise library
    Given I am on the exercise library page
    And exercises exist in the database
    Then I should see exercise items in the list
    And each exercise item should display its name
    And each exercise item should display "+{increment} lbs per progression"
    And each exercise item should have a delete button
    And each exercise item should be clickable to view history

  Scenario: Loading state
    Given I am on the exercise library page
    When the exercises are being fetched from the API
    Then I should see a loading spinner

  Scenario: Error state
    Given I am on the exercise library page
    When the API request fails
    Then I should see an error message
```

### Creating Exercises

```gherkin
Feature: Create Custom Exercise

  Scenario: Successfully create exercise with default weight increment
    Given I am on the exercise library page
    When I enter "Barbell Squat" in the exercise name field
    And I leave the weight increment field at default value "5"
    And I click the "Add Exercise" button
    Then the exercise should appear in the library list
    And the form should be cleared to empty values

  Scenario: Create exercise with custom weight increment
    Given I am on the exercise library page
    When I enter "Overhead Press" in the exercise name field
    And I enter "2.5" in the weight increment field
    And I click the "Add Exercise" button
    Then the exercise should display "+2.5 lbs per progression" in the list

  Scenario: Validate required exercise name
    Given I am on the exercise library page
    When I leave the exercise name field empty
    And I click the "Add Exercise" button
    Then I should see a validation error "Exercise name is required"
    And the API should not be called

  Scenario: Validate exercise name length
    Given I am on the exercise library page
    When I enter a 101-character string in the exercise name field
    And I click the "Add Exercise" button
    Then I should see a validation error "Exercise name must be 100 characters or less"

  Scenario: Validate weight increment is positive
    Given I am on the exercise library page
    When I enter "Bench Press" in the exercise name field
    And I enter "0" in the weight increment field
    And I click the "Add Exercise" button
    Then I should see a validation error "Weight increment must be a positive number"

  Scenario: Handle API error during creation
    Given I am on the exercise library page
    When I enter "Barbell Squat" in the exercise name field
    And I click the "Add Exercise" button
    And the API returns a 409 Conflict error
    Then I should see an error message "Exercise already exists"
    And the form should retain my input values

  Scenario: Button state during submission
    Given I am on the exercise library page
    When I click the "Add Exercise" button
    And the API request is in progress
    Then the button text should change to "Adding..."
    And the submit button should be disabled
```

### Editing Exercises

```gherkin
Feature: Edit Exercise

  Scenario: Open edit dialog from exercise history page
    Given I am viewing the history page for exercise "Barbell Squat"
    When I click the edit icon button next to the exercise name
    Then the edit exercise dialog should open
    And the name field should be pre-filled with "Barbell Squat"
    And the weight increment field should be pre-filled with current value

  Scenario: Successfully update exercise name
    Given the edit dialog is open for exercise "Barbell Squat"
    When I change the name to "Back Squat"
    And I click the "Save" button
    Then the dialog should close
    And the exercise name should update in the library list

  Scenario: Successfully update weight increment
    Given the edit dialog is open for exercise "Overhead Press"
    When I change the weight increment to "2.5"
    And I click the "Save" button
    Then the exercise should display "+2.5 lbs per progression" in the list

  Scenario: Validate exercise name in edit dialog
    Given the edit dialog is open for an exercise
    When I clear the name field
    And I click the "Save" button
    Then I should see a validation error "Exercise name is required"
    And the dialog should remain open

  Scenario: Cancel editing
    Given the edit dialog is open for exercise "Barbell Squat"
    When I change the name to "Back Squat"
    And I click the "Cancel" button
    Then the dialog should close
    And the exercise name should remain "Barbell Squat"
```

### Deleting Exercises

```gherkin
Feature: Delete Exercise

  Scenario: Open delete confirmation dialog
    Given I am on the exercise library page
    And an exercise "Barbell Squat" exists
    When I click the trash icon on the exercise item
    Then the delete confirmation dialog should open
    And I should see "Are you sure you want to delete Barbell Squat?"

  Scenario: Successfully delete unused exercise
    Given the delete confirmation dialog is open
    When I click the "Delete" button
    Then the dialog should close
    And the exercise should be removed from the library list

  Scenario: Cancel deletion
    Given the delete confirmation dialog is open
    When I click the "Cancel" button
    Then the dialog should close
    And the exercise should remain in the library

  Scenario: Prevent deletion of exercise in use
    Given an exercise "Barbell Squat" is used in an active workout plan
    When I open the delete dialog
    And I click the "Delete" button
    Then the API should return a 409 Conflict error
    And I should see an error message "Cannot delete exercise that is used in a plan"
    And the exercise should remain in the library
```

### Exercise History Viewing

```gherkin
Feature: View Exercise History

  Scenario: Navigate to exercise history
    Given I am on the exercise library page
    And an exercise "Barbell Squat" exists
    When I click on the exercise item
    Then I should navigate to "/lifting/exercises/{id}/history"

  Scenario: View history with no workout data
    Given I am on the exercise history page for "Barbell Squat"
    And the exercise has never been used in a workout
    Then I should see the exercise name as the heading
    And I should see "No history yet"
    And I should not see the weight progression chart
    And I should not see the set history table

  Scenario: View history with workout data
    Given I am on the exercise history page for "Barbell Squat"
    And the exercise has workout history entries
    Then I should see the weight progression chart
    And I should see the set history table

  Scenario: Display personal record
    Given I am on the exercise history page for "Barbell Squat"
    And the exercise has a personal record of 315 lbs x 5 reps
    Then I should see a yellow badge labeled "PR"
    And I should see "315 lbs x 5 reps"

  Scenario: Loading state
    Given I am navigating to an exercise history page
    When the history data is being fetched
    Then I should see a loading spinner

  Scenario: Error state - Exercise not found
    Given I navigate to a non-existent exercise
    When the API returns a 404 error
    Then I should see an error message "Exercise not found"

  Scenario: Navigate back to exercise library
    Given I am on the exercise history page
    When I click the "Back to Exercises" button
    Then I should navigate to "/lifting/exercises"
```

### Weight Progression Chart

```gherkin
Feature: Weight Progression Chart

  Scenario: Display chart with workout data
    Given I am on the exercise history page
    And the exercise has workout history entries
    Then I should see a section titled "Weight Progression"
    And I should see a line chart

  Scenario: Chart displays weight values on Y-axis
    Given the exercise has history with weights ranging from 135 to 180 lbs
    Then the Y-axis should be labeled "lbs"
    And the Y-axis should display appropriate values

  Scenario: Chart displays dates on X-axis
    Given the exercise has workout entries on multiple dates
    Then the X-axis should display formatted dates

  Scenario: Chart tooltip
    Given I am viewing the weight progression chart
    When I hover over a data point
    Then I should see a tooltip
    And the tooltip should display the weight value
    And the tooltip should display the number of reps
```

### Set History Table

```gherkin
Feature: Set History Table

  Scenario: Display table with workout data
    Given I am on the exercise history page
    And the exercise has workout history entries
    Then I should see a section titled "Set History"
    And I should see a table with column headers:
      | Date | Weight | Reps | Sets |

  Scenario: Display workout entries in reverse chronological order
    Given the exercise has multiple workout entries
    Then the most recent workout should appear first

  Scenario: Display workout date
    Given a workout was completed on "2024-06-15"
    Then the date column should display "6/15/2024"

  Scenario: Display best weight for workout
    Given a workout had sets with weights: 135, 140, 135 lbs
    Then the weight column should display "140 lbs"

  Scenario: Display reps for best set
    Given a workout's best set was 140 lbs x 8 reps
    Then the reps column should display "8"

  Scenario: Display total sets completed
    Given a workout had 3 sets completed
    Then the sets column should display "3"
```

### API Integration

```gherkin
Feature: Exercise API Integration

  Scenario: Fetch all exercises
    Given I request GET "/api/exercises"
    Then the API should return status 200
    And the response should include an array of exercises

  Scenario: Create exercise with valid data
    When I request POST "/api/exercises" with valid body
    Then the API should return status 201
    And the response should include the created exercise with generated id

  Scenario: Create exercise with validation error
    When I request POST "/api/exercises" with invalid body
    Then the API should return status 400
    And the error code should be "VALIDATION_ERROR"

  Scenario: Update exercise
    Given an exercise with id 42 exists
    When I request PUT "/api/exercises/42" with valid body
    Then the API should return status 200

  Scenario: Delete exercise
    Given an exercise with id 42 exists
    And the exercise is not used in any plans
    When I request DELETE "/api/exercises/42"
    Then the API should return status 204

  Scenario: Delete exercise in use
    Given an exercise with id 42 is used in a workout plan
    When I request DELETE "/api/exercises/42"
    Then the API should return status 409
    And the error message should be "Cannot delete exercise that is used in a plan"

  Scenario: Fetch exercise history
    Given an exercise with id 42 exists
    When I request GET "/api/exercises/42/history"
    Then the API should return status 200
    And the response should include entries and personal_record data
```

### React Query Cache Management

```gherkin
Feature: React Query Cache Management

  Scenario: Cache exercise list on initial load
    Given I am on the exercise library page
    When the exercises are fetched successfully
    Then React Query should cache the data with key ['exercises', 'list']

  Scenario: Invalidate list cache after creation
    Given I successfully create an exercise
    Then React Query should invalidate queries with key ['exercises', 'list']
    And the exercise list should refetch automatically

  Scenario: Invalidate caches after update
    Given I successfully update exercise with id 42
    Then React Query should invalidate queries with key ['exercises', 'list']
    And React Query should set the detail cache with updated data

  Scenario: Invalidate and remove caches after deletion
    Given I successfully delete exercise with id 42
    Then React Query should invalidate queries with key ['exercises', 'list']
    And React Query should remove queries with key ['exercises', 'detail', 42]
```
