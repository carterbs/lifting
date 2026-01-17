I want to make a tiny web app that tracks my weight training workouts. I want it to run on my home server.

Requirements:

- Plan creator
  - A plan consists of 6 weeks of progressive overload. An instance of a plan (a 6 week duration where one exercises following the plan) is called a mesocycle. After 6 weeks, the app should provide a deload week, and the user should have the option to move on to another mesocycle of the same plan.
  - Each week consists of 7 POSSIBLE days to workout. User has to decide how many days a week they want to workout. User also has to choose the days of the week that they wish to work out. There are no two-a-days.
  - When creating the plan, the user will have to decide which exercises are to be done on which day. Exercises are selected via a dropdown. The number of exercises for a given day is uncapped.
  - Adding a new exercise to a day should be trivial.
  - A day in a plan consists of 1 to N exercises
    - Each exercise will need weight (in lbs), sets, reps, and rest time (in seconds) as configurable options. Dropdowns are fine for sets, reps, and weight.
    - Default to 2 sets, 8 reps, and 30 lbs for weight.
    - Default to 1 minute for rest time
  - Initial set of exercises:
    - Dumbell Press (flat)
    - Seated Cable Row
    - Leg Extension
    - Machine Triceps extension
    - Seated Dumbell lateral raises
    - Pulldowns (narrow grip)
    - Pec dec flye
    - Machine Reverse fly
    - Cable Triceps pushdown
    - Cable Curl
    - Single leg curl
    - Machine Preacher curl
  - Plan duration should be configurable when creating the plan; dewfault to 6 weeks.
- Workout tracker
  - Users may have N plans, but only one plan may be active at a given time. Having 0 active plans is also fine. Once activated, a plan stays active until it is completed by the user (all workouts are either skipped or completed, or the plan is cancelled).
  - The app should guide the user through the mesocycle. Each meso should break down to weeks. and weeks have plan days. The user should specify a starting weight and rep range and weight. In week 0, we use what the user provided. In week 1, we add one rep to each exercise. In week 2, we add weight. In week 3, we add a rep. And so on.
  - When tracking a specific workout, the app should prefill weights, reps, and sets. The user should be able to remove sets, modify reps, and modify weight.
  - There should be a mechanism to log a set. This should persist to the next time that the plan asks the user to do a specific workout.
  - There should be a rest tracker. After the set is logged, a timer should count up to the configured rest period, then play a noise.
  - Sets may be skipped
  - A workout can be completed regardless of whether all sets were logged by the user
  - If the user does not log all sets, the app should NOT progress sets/weight in the following week. Just give them the same sets/reps.
- Tech choices
  - Monorepo
  - React for the UI (Radix for components: https://www.radix-ui.com/primitives/docs/overview/introduction)
  - SSR is unnecessary
  - Sqlite for storage
  - 100% unit test coverage for every feature.
  - E2E test coverage with puppeteer
    - This will require some kind of setup where we can start in the middle of arbitrary user flows. E.g., mid workout, starting a workout, creating a plan, etc.
    - Flows I care about for the e2e test:
      - Workout tracking
        - Logging a set
        - Removing a set from a workout
        - Changing weight and reps
        - Automated progression
          - Track a workout, see what the app plans the following week.
  - Incredibly opinionated linting and type checking.
  - Backend language: Node-ts is fine.
  - IMPORTANT: No use of `any` throughout the codebase. Everything should be strongly typed.

  ## Clarifying Questions

1. **User authentication**: Is this a single-user application, or should it support multiple users with login functionality? A: Single-user

2. **Progressive overload weight increment**: When adding weight in week 2 (and subsequent even weeks), how much weight should be added? Is this a fixed amount (e.g., 5 lbs), or should it be configurable per exercise? A: 5lbs is a fine default, make it configurable when adding new exercises.

3. **Deload week specifics**: What does the deload week entail? Reduced weight (e.g., 50% of working weight)? Reduced sets? Reduced reps? Or is it simply a rest week with no prescribed workouts? A: When creating our eventual implementation plan, the agent should look up best practices for deload. I'm imagining the same workout but with reduced volume. The specific amount should be based on best practices.

4. **Custom exercises**: Can users add their own exercises beyond the initial set provided, or is the exercise list fixed? A: Custom exercises can be added.

5. **Mobile/offline support**: Since users will likely track workouts at the gym where connectivity may be limited, should this be a Progressive Web App (PWA) with offline capability? A: No, that's unecessary complexity. Intra-workout changes should write to local storage. Completing a workout should write to the database.

6. **Visual design**: Should the app be dark mode, light mode, or have a toggle? Any color scheme preferences, or should the agent pick something functional? A: Light mode with pleasant accent colors. Agent can pick.

7. **Rest timer sound**: What audio should play when rest is complete? A simple beep, a spoken alert, a chime? Should the sound repeat until dismissed, or play once? A: A beep or a boop or something; play once.

8. **Missed workout handling**: If a user doesn't complete their scheduled Monday workout, what happens? Does it carry over to the next available day, stay accessible until they manually skip it, or auto-skip at week's end? A: Nothing happens! You just wait for the user to complete or skip the workout.

9. **Workout history visibility**: Should users be able to view past workout logs (e.g., "what did I lift 3 weeks ago")? Should there be any charts/graphs showing progress over time, or is that scope creep? A: Yes, build for the possibility of tracking exercise progression over time. This is a v1 thing though, not a V0 thing.

10. **Server configuration**: What port should the app run on? Any preferences for how it starts (systemd service, docker container, plain node process)? A: Docker.

11. **Dropdown value ranges**: For weight, what range and increment (e.g., 5-300 lbs in 5 lb steps, or 2.5 lb increments for smaller muscles)? For reps, 1-20? For sets, 1-10? For rest time, what increments (15 seconds, 30 seconds)? A: All of those sound reasonable. I don't care about the details here.

12. **Exercise order during workout**: When tracking a workout, must the user complete exercises in the order listed in the plan, or can they tap any exercise and log sets in whatever order they prefer? A: They can do what they want, since equipment may or may not be available when they get to the gym.

13. **Active plan modification**: Once a mesocycle is in progress, can the user edit the underlying plan (add/remove exercises, change days)? Or is the plan locked until the mesocycle completes/cancels? A: Yes!

14. **Navigation structure**: What's the main landing page? Should there be a dashboard, or go straight to "today's workout"? Tabs at the bottom, sidebar, or simple page-based navigation? A: Tabs at the bottom feels good. Today, Meso, Exercise Library

15. **Cancelled mesocycle data**: When a user cancels an in-progress mesocycle, should all logged workout data from that mesocycle be preserved (for history) or deleted? A: It should be preserved, so if we create a new meso and re-use exercise, we remember where they are with an exercise.
