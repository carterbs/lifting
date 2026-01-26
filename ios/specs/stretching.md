# Stretching Feature

## Description

The Stretching feature provides a guided, narrated stretching session system with configurable body regions, audio guidance, and optional Spotify integration. Users can configure which body regions to stretch, set durations (1 or 2 minutes per region), and optionally launch Spotify playlists for background music during the session.

Each stretching session consists of multiple stretches (one randomly selected per enabled body region). Each stretch is divided into two segments of equal duration. For bilateral stretches (e.g., left/right side stretches), the segments represent sides; for non-bilateral stretches, they represent progression through the stretch. The system provides audio narration at the beginning of each stretch and at the midpoint transition.

The feature includes crash recovery via localStorage persistence (sessions saved for up to 1 hour), automatic pausing after 30 minutes of inactivity, and session history tracking saved to the server upon completion. The stretching data is loaded from a JSON manifest containing 8 body regions with 4-5 stretches each.

## Requirements

### Session Configuration

```gherkin
Feature: Configure Stretching Session

  Scenario: View default configuration on first load
    Given I am a new user
    And I navigate to the Stretch page
    Then I should see all 8 body regions listed
    And all regions should be enabled by default
    And the total session time should be calculated from durations

  Scenario: Toggle region enabled/disabled
    Given I am on the Stretch setup screen
    When I disable "Neck" by toggling its switch
    Then the region should appear dimmed
    And the total session time should decrease
    When I re-enable "Neck"
    Then the region should appear normal
    And the total session time should increase

  Scenario: Toggle stretch duration
    Given I am on the Stretch setup screen
    And "Back" has a duration of "2m"
    When I tap the "2m" duration badge for "Back"
    Then the duration should change to "1m"

  Scenario: Reorder body regions via drag-and-drop
    Given I am on the Stretch setup screen
    When I drag "Back" above "Shoulders"
    Then "Back" should appear before "Shoulders" in the list
    And the configuration should be saved to localStorage

  Scenario: Configure Spotify playlist URL
    Given I am on the Stretch setup screen
    When I enter a Spotify URL in the field
    And I blur the input field
    Then the Spotify URL should be saved to localStorage

  Scenario: Cannot start session with no regions enabled
    Given I am on the Stretch setup screen
    When I disable all body regions
    Then the "Start Stretching" button should be disabled
```

### Session Lifecycle

```gherkin
Feature: Start and Run Stretching Session

  Scenario: Start session without Spotify
    Given I have at least one region enabled
    And I have not configured a Spotify URL
    When I tap "Start Stretching"
    Then the audio system should be initialized
    And a random stretch should be selected for each enabled region
    And the session should start immediately
    And narration audio should play for the first stretch

  Scenario: Start session with Spotify configured
    Given I have configured a Spotify playlist URL
    When I tap "Start Stretching"
    Then Spotify should open via deep link
    When I return to the app
    Then the session should start

  Scenario: Progress through a bilateral stretch
    Given I am in an active session
    And the current stretch is bilateral
    And I am on segment 1 (Left Side)
    When the countdown completes
    Then the segment should advance to segment 2 (Right Side)
    And the "switch sides" narration should play

  Scenario: Progress through a non-bilateral stretch
    Given I am in an active session
    And the current stretch is non-bilateral
    And I am on segment 1
    When the countdown completes
    Then the segment should advance to segment 2
    And the "halfway" narration should play

  Scenario: Progress to next stretch
    Given I am on the last segment of the current stretch
    And there are more stretches remaining
    When the segment countdown completes
    Then the session should advance to the next stretch
    And the narration for the new stretch should play

  Scenario: Complete the final stretch
    Given I am on the last segment of the last stretch
    When the segment countdown completes
    Then the session status should change to "complete"
    And the completion screen should be displayed
```

### Pause and Resume

```gherkin
Feature: Pause and Resume Session

  Scenario: Pause active session
    Given I am in an active session
    When I tap "Pause"
    Then the session status should change to "paused"
    And the countdown timer should stop
    And the elapsed time should be saved
    And the MediaSession playback state should be set to "paused"

  Scenario: Resume paused session
    Given I have a paused session
    When I tap "Resume"
    Then the session status should change to "active"
    And the countdown timer should resume from the remaining time

  Scenario: Auto-end session after 30 minutes of pause
    Given I have paused a session
    When 30 minutes have passed
    Then the session should automatically end
    And I should return to the setup screen

  Scenario: Pause via MediaSession (lock screen)
    Given I am in an active session with the screen locked
    When I tap the pause button on the lock screen controls
    Then the session should pause

  Scenario: Resume via MediaSession (lock screen)
    Given I have a paused session with the screen locked
    When I tap the play button on the lock screen controls
    Then the session should resume
```

### Skip Controls

```gherkin
Feature: Skip Segments and Stretches

  Scenario: Skip current segment
    Given I am in an active session
    When I tap "Skip Segment"
    Then any playing narration should stop
    And the skipped segment should be recorded
    And the session should advance to the next segment

  Scenario: Skip entire stretch
    Given I am in an active session
    When I tap "Skip Stretch"
    Then any playing narration should stop
    And both segments should be recorded as skipped
    And the session should advance to the next stretch

  Scenario: Skip the last stretch
    Given I am on the last stretch
    When I tap "Skip Stretch"
    Then the session should complete
    And the completion screen should be displayed
```

### End Session Early

```gherkin
Feature: End Session Early

  Scenario: Tap Stop button shows confirmation dialog
    Given I am in an active session
    When I tap the "Stop" button
    Then a confirmation dialog should appear

  Scenario: Confirm stop and end session
    Given the stop confirmation dialog is open
    When I tap "End Session"
    Then the countdown timer should stop
    And all audio should stop
    And I should return to the setup screen
    And no session record should be saved
```

### Session Recovery

```gherkin
Feature: Recover Interrupted Session

  Scenario: Saved session exists and is fresh (< 1 hour old)
    Given I started a session recently
    And the app crashed or was closed
    When I reopen the app
    Then I should see a "Session Recovery Prompt"
    And I should see "Resume" and "Start Over" buttons

  Scenario: Resume saved session
    Given I see the session recovery prompt
    When I tap "Resume"
    Then the session should resume from where I left off

  Scenario: Discard saved session
    Given I see the session recovery prompt
    When I tap "Start Over"
    Then the saved session state should be cleared
    And I should see the setup screen

  Scenario: Saved session is stale (> 1 hour old)
    Given I started a session 2 hours ago
    When I reopen the app
    Then the saved session should be silently discarded
    And I should see the setup screen
```

### Audio Playback

```gherkin
Feature: Audio Narration and Keepalive

  Scenario: Play stretch begin narration
    Given I am starting a new stretch
    Then the narration audio should play
    And the keepalive loop should continue running at 1% volume

  Scenario: Keepalive maintains audio session during lock screen
    Given I am in an active session
    And the keepalive loop is running
    When I lock my phone screen
    Then the audio session should remain active
    And Spotify should be able to continue playing

  Scenario: Stop all audio when ending session
    Given I am in an active session
    When I end the session
    Then all audio should stop
    And the MediaSession metadata should be cleared
```

### MediaSession Integration

```gherkin
Feature: Lock Screen Controls

  Scenario: Update MediaSession metadata for each stretch
    Given I start a stretch
    Then the MediaSession metadata should be set with the stretch name and region

  Scenario: Lock screen pause button
    Given I am in an active session with the screen locked
    When I tap the pause button on the lock screen
    Then the session should pause

  Scenario: Lock screen next track button
    Given I am in an active session with the screen locked
    When I tap the next track button on the lock screen
    Then the current segment should be skipped
```

### Session Completion and History

```gherkin
Feature: Complete Session and Save History

  Scenario: Complete full session with no skips
    Given I have completed all segments of all stretches
    When the final segment completes
    Then I should see the completion screen
    And I should see session statistics
    And a session record should save to the server

  Scenario: View list of completed stretches
    Given I am on the completion screen
    Then I should see a list of stretches performed
    And each stretch should show skip status if applicable

  Scenario: Return to setup from completion screen
    Given I am on the completion screen
    When I tap "Done"
    Then I should return to the setup screen

  Scenario: Latest session appears on setup screen
    Given I completed a session today
    When I return to the setup screen
    Then I should see "Last stretched: Today"
```

### Stretch Data

```gherkin
Feature: Load Stretch Manifest

  Scenario: Load stretch manifest on page mount
    Given I navigate to the Stretch page
    Then the manifest should be fetched from /audio/stretching/stretches.json
    And the manifest should contain 8 body regions

  Scenario: Random stretch selection per region
    Given the manifest has been loaded
    And a region has multiple available stretches
    When I start a session with that region enabled
    Then one random stretch should be selected
```

### Body Regions and Stretches

```gherkin
Feature: Available Stretches

  Scenario: Neck stretches
    Given the "Neck" region is enabled
    Then available stretches include:
      | Stretch Name       | Bilateral |
      | Neck Forward Tilt  | No        |
      | Upper Trapezius    | Yes       |
      | Levator Scapulae   | Yes       |

  Scenario: Shoulders stretches
    Given the "Shoulders" region is enabled
    Then available stretches include:
      | Stretch Name        | Bilateral |
      | Cross Body          | Yes       |
      | Overhead            | Yes       |
      | Arm Behind The Back | Yes       |

  Scenario: Back stretches
    Given the "Back" region is enabled
    Then available stretches include:
      | Stretch Name    | Bilateral |
      | Cat Cow         | No        |
      | Knees To Chest  | No        |
      | Cobra           | No        |

  Scenario: Hip Flexors stretches
    Given the "Hip Flexors" region is enabled
    Then available stretches include:
      | Stretch Name    | Bilateral |
      | Kneeling        | Yes       |
      | Standing Lunge  | Yes       |
      | Pigeon Pose     | Yes       |

  Scenario: Glutes stretches
    Given the "Glutes" region is enabled
    Then available stretches include:
      | Stretch Name         | Bilateral |
      | Seated Figure Four   | Yes       |
      | Standing             | Yes       |
      | Cross Body           | Yes       |
      | Supine Figure Four   | Yes       |

  Scenario: Hamstrings stretches
    Given the "Hamstrings" region is enabled
    Then available stretches include:
      | Stretch Name     | Bilateral |
      | Standing         | No        |
      | Supine           | Yes       |
      | Standing One Leg | Yes       |

  Scenario: Quads stretches
    Given the "Quads" region is enabled
    Then available stretches include:
      | Stretch Name   | Bilateral |
      | Standing       | Yes       |
      | Lunge          | Yes       |
      | Side Lying     | Yes       |
      | Reverse Lunge  | Yes       |
      | Prone          | No        |

  Scenario: Calves stretches
    Given the "Calves" region is enabled
    Then available stretches include:
      | Stretch Name   | Bilateral |
      | Standing Calf  | Yes       |
      | Wall Push Up   | Yes       |
      | Bent Knee      | Yes       |
      | Single Leg     | Yes       |
```
