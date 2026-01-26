# Meditation Feature

## Description

The Meditation feature provides guided breathing meditation sessions with configurable durations (5, 10, or 20 minutes). Users configure their desired session length, then engage with a breathing circle animation synchronized with audio narration cues. The feature handles the complete lifecycle from setup to session completion, including pause/resume functionality, crash recovery, and background playback support.

The meditation experience centers around a breathing circle animation that scales and changes opacity in a 14-second cycle (inhale 4s, hold 2s, exhale 6s, rest 2s). Audio cues are scheduled based on a manifest loaded from the server, with fixed cues playing at predetermined times and randomized interjections occurring within specified windows. Sessions automatically save to the server upon completion, tracking both planned and actual duration, and whether the session was completed fully or ended early.

The implementation uses HTML5 Audio elements (not Web Audio API) to maintain background playback and integrate with the MediaSession API for lock screen controls. Session state persists to localStorage for crash recovery, with stale sessions (older than 1 hour) automatically discarded.

## Requirements

### Session Configuration

```gherkin
Feature: Duration Selection

  Scenario: User selects a meditation duration
    Given the user is on the meditation setup screen
    When they select a duration option (5, 10, or 20 minutes)
    Then the selected duration is highlighted with a visual indicator
    And the selection is saved to localStorage

  Scenario: Previously selected duration is remembered
    Given the user previously selected 20 minutes
    When they return to the meditation setup screen
    Then 20 minutes is pre-selected by default

  Scenario: Default duration for first-time users
    Given the user has never selected a duration
    When they visit the meditation setup screen for the first time
    Then 10 minutes is selected by default
```

### Session Initialization

```gherkin
Feature: Starting a Meditation Session

  Scenario: User starts a new session
    Given the user has selected a duration
    When they tap "Begin Meditation"
    Then the audio system is initialized
    And the meditation manifest is loaded
    And scheduled cues are generated with randomized interjection times
    And a timestamp-based timer starts
    And the session state is saved to localStorage with status 'active'
    And the MediaSession metadata is set
    And the breathing circle animation begins

  Scenario: Audio initialization requires user gesture
    Given the user is on the meditation setup screen
    When they tap "Begin Meditation"
    Then audio elements are created during this click handler
    And subsequent audio playback will work on iOS
```

### Breathing Circle Animation

```gherkin
Feature: Visual Breathing Guide

  Scenario: Circle animates through breathing cycle
    Given a meditation session is active
    Then the circle continuously animates in a 14-second cycle
    And the cycle phases are:
      | Phase   | Duration | Scale | Opacity |
      | Inhale  | 4s       | 1-1.8 | 0.6-1.0 |
      | Hold    | 2s       | 1.8   | 1.0     |
      | Exhale  | 6s       | 1.8-1 | 1.0-0.6 |
      | Rest    | 2s       | 1     | 0.6     |

  Scenario: Animation pauses when session is paused
    Given a meditation session is active
    When the user taps "Pause"
    Then the breathing circle animation freezes at its current position

  Scenario: Animation resumes from paused position
    Given a session is paused with the circle mid-inhale
    When the user taps "Resume"
    Then the animation continues from the frozen position
```

### Session Timer

```gherkin
Feature: Countdown Timer

  Scenario: Timer counts down from total duration
    Given a 10-minute session starts at timestamp T
    When the timer updates every 100ms
    Then elapsed seconds = floor((Date.now() - T) / 1000)
    And remaining seconds = total seconds - elapsed seconds
    And the timer displays as "MM:SS" format

  Scenario: Timer updates while tab is backgrounded
    Given a session is active
    When the user switches to another tab for 2 minutes
    And returns to the meditation tab
    Then the timer recalculates from the original timestamp
    And displays the correct remaining time

  Scenario: Session completes when timer reaches zero
    Given a session has 1 second remaining
    When the timer updates and elapsed >= total seconds
    Then the session status changes to 'complete'
    And the closing bell plays
    And the completion screen displays
```

### Audio Cue System

```gherkin
Feature: Narration Playback

  Scenario: Fixed cues play at scheduled times
    Given a session variant has a fixed cue at 30 seconds
    When elapsed time reaches 30 seconds
    Then the narration audio file plays automatically
    And the cue is marked as 'played' in state

  Scenario: Multiple cues due at same time
    Given two cues are scheduled at 30s and 31s
    When elapsed time reaches 31 seconds
    And the 30s cue is still playing
    Then the 31s cue waits until the 30s cue finishes

  Scenario: Bell plays at session end only
    Given a session completes fully
    When elapsed time reaches total duration
    Then the bell.wav audio plays

  Scenario: Audio playback fails
    Given a narration cue is triggered
    When the audio file fails to load
    Then an error overlay displays over the session
    And the user can "Retry" or "Skip"
```

### Pause and Resume

```gherkin
Feature: Session Pause Control

  Scenario: User pauses an active session
    Given a session is active
    When the user taps "Pause"
    Then the session status changes to 'paused'
    And pausedAt timestamp is set
    And the timer interval is cleared
    And any playing narration stops immediately
    And the MediaSession playback state is set to 'paused'
    And the state is saved to localStorage

  Scenario: User resumes a paused session
    Given a session is paused with pausedElapsed = 120 seconds
    When the user taps "Resume"
    Then sessionStartedAt is set to Date.now() - (120 * 1000)
    And the session status changes to 'active'
    And the timer interval restarts

  Scenario: Paused session times out after 30 minutes
    Given a session is paused at time T
    When 31 minutes elapse
    Then the session automatically ends
    And the state is cleared from localStorage
```

### Early Session Termination

```gherkin
Feature: Ending a Session Early

  Scenario: User initiates early end
    Given a session is active or paused
    When the user taps "End"
    Then a confirmation dialog displays

  Scenario: User confirms ending session
    Given the end confirmation dialog is displayed
    When the user taps "End Session"
    Then the timer stops immediately
    And all audio stops
    And localStorage session state is cleared
    And the completion screen displays with completedFully = false

  Scenario: User cancels ending session
    Given the end confirmation dialog is displayed
    When the user taps "Cancel"
    Then the dialog closes
    And the session continues
```

### Session Completion

```gherkin
Feature: Session Summary

  Scenario: Session completes fully
    Given a 10-minute session reaches its full duration
    When the timer hits zero
    Then the completion screen displays
    And shows "Session Complete!"
    And displays planned duration as "10m"
    And displays actual duration
    And shows "completed fully" indicator
    And a session record saves to the server

  Scenario: Session ends early
    Given a 10-minute session is ended after 3 minutes 45 seconds
    When the completion screen displays
    Then planned duration shows "10m"
    And actual duration shows "3m 45s"
    And shows "ended early" indicator

  Scenario: User returns to setup from completion
    Given the completion screen is displayed
    When the user taps "Done"
    Then all audio stops
    And session state is cleared
    And the setup screen displays
```

### Crash Recovery

```gherkin
Feature: Session State Persistence

  Scenario: User returns after browser crash during active session
    Given a session was active at time T with pausedElapsed = 180 seconds
    When the user reopens the app within 1 hour
    Then a recovery prompt displays
    And asks "Would you like to resume where you left off?"

  Scenario: User resumes saved session
    Given a saved session exists with pausedElapsed = 180 seconds
    When the user taps "Resume"
    Then sessionStartedAt is set to Date.now() - (180 * 1000)
    And the session continues
    And already-played cues remain marked as played

  Scenario: User discards saved session
    Given a saved session exists
    When the user taps "Start Over"
    Then the saved state is cleared from localStorage
    And the setup screen displays

  Scenario: Saved session is stale (older than 1 hour)
    Given a saved session has pausedAt = 2 hours ago
    When the user opens the app
    Then the saved state is silently discarded
    And the setup screen displays normally
```

### Background and Lock Screen Support

```gherkin
Feature: MediaSession Integration

  Scenario: Lock screen controls appear when session starts
    Given a session starts
    Then MediaSession metadata is set with:
      | Field  | Value              |
      | title  | Basic Breathing    |
      | artist | Introduction       |
      | album  | Meditation         |
    And lock screen media controls appear

  Scenario: User pauses from lock screen
    Given a session is active
    When the user taps pause on lock screen controls
    Then the session pauses

  Scenario: User resumes from lock screen
    Given a session is paused
    When the user taps play on lock screen controls
    Then the session resumes

  Scenario: Keepalive maintains background audio session
    Given a session is active
    When the app is backgrounded or screen locks
    Then the silent 1-second looping audio continues playing
    And the audio session remains active
    And scheduled cues trigger at their correct times
```

### Session History

```gherkin
Feature: Tracking Meditation History

  Scenario: Latest session query
    Given the user has completed meditation sessions
    When the setup screen loads
    Then a GET request to /api/meditation-sessions/latest fetches the most recent session
    And "Last meditated: [date]" displays if a session exists

  Scenario: Creating a session record
    Given a session completes
    When the completion screen mounts
    Then a POST request to /api/meditation-sessions is sent with:
      | Field                    | Type    |
      | completedAt              | string  |
      | sessionType              | string  |
      | plannedDurationSeconds   | number  |
      | actualDurationSeconds    | number  |
      | completedFully           | boolean |
```
