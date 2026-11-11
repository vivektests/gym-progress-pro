# Gym Progress Pro — Advanced Workout Feature Roadmap

## Product direction

Turn Gym Progress Pro from a reliable workout log into an adaptive training system: it should use an athlete’s historical performance and current fatigue to recommend the next exact target, explain why that target was chosen, and make multi-week programming easy to run and adjust.

This roadmap applies only to the deployed web application. The existing mobile app remains out of scope and must not be modified.

## Current baseline

The web app already has authenticated per-user workout storage, splits, custom exercises, set logging with RPE, basic progression recommendations, progress charts, estimated 1RM milestones, muscle recovery heatmaps, history, and CSV/PDF exports.

The key gaps are advanced progression math, RIR support and RPE-driven autoregulation, richer weekly muscle analytics, multi-week programming, configurable rest timers, and template duplication.

## Recommended release sequence

### Release 1 — Training data foundation and measurement quality

**Goal:** Make the data model expressive enough for every later feature without invalidating existing workout history.

Add the following additive fields and entities:

- `rirTenth` on logged sets, nullable for historical records.
- A normalized `trainingBlocks` table with user ownership, name, goal, start date, duration in weeks, status, and notes.
- A `trainingBlockWeeks` table for week number, label, intent, deload flag, and target volume multiplier.
- Optional exercise prescription fields for target RPE/RIR, rep minimum, rep maximum, load increment, and progression strategy.
- `restSeconds` on active workout exercises, copied from the selected prescription.
- A `programTemplates`/template-copy mechanism, preferably implemented by cloning user-owned split/block records rather than sharing mutable records.

Preserve existing rows through nullable migrations and default values. Keep all new records user-scoped.

**Acceptance criteria:** Existing users can open and complete old workouts; new sets can store RPE and RIR independently; a split can be assigned to a week in a training block; an active workout receives a rest duration from its prescription.

### Release 2 — Advanced progressive overload engine

**Goal:** Replace the current one-rule recommendation with explainable, historical, exact next-session targets.

Implement a pure recommendation engine with versioned inputs and outputs. It should evaluate recent sessions for the same exercise, working-set consistency, rep-range completion, estimated 1RM trend, RPE/RIR, missed targets, and recent deload or inactivity.

Support at least these strategies:

- Double progression: increase reps within a range before increasing load.
- Fixed-load progression: add one or more reps when load is stable.
- Load progression: increase by the configured increment after all prescribed sets clear the rep and effort thresholds.
- Fatigue hold: maintain or reduce load when effort is too high or performance falls below the recent baseline.
- Deload suggestion: reduce load or set count after repeated fatigue or stalled performance.

Every recommendation should return the exact target load, rep target or rep range, target sets, confidence, reason, and the historical evidence used.

**Acceptance criteria:** For any eligible exercise, the next-session card shows exact targets such as `82.5 kg × 8–10 for 3 sets`; the recommendation includes a readable reason; repeated high-RPE or declining sessions produce a hold/reduce recommendation; the engine has deterministic unit tests for each strategy and edge case.

### Release 3 — RPE/RIR auto-regulation

**Goal:** Make effort data influence the next set and next session instead of being passive metadata.

Add RIR input beside RPE, with a conversion helper for users who enter either metric. Validate RPE to 0–10 and RIR to a sensible range such as 0–6. Display the logged effort in set history and exercise summaries.

Use effort thresholds in the recommendation engine. For example, sets substantially above target RPE or at zero RIR should reduce the next target, while sets below target effort can add load or reps. Do not silently override the user’s chosen load; present the adjustment and allow acceptance or manual editing.

**Acceptance criteria:** A user can log either RPE or RIR per set; the next-target preview shows how the effort signal changed the recommendation; conflicting values are validated; recommendations remain understandable and reversible.

### Release 4 — Live 1RM and performance intelligence

**Goal:** Make estimated strength a first-class, continuously updated metric.

Track estimated 1RM per completed set using Epley as the default, with a clear formula label and the option to add Brzycki later if evidence supports it. Store daily best e1RM per exercise and expose the latest, all-time best, rolling trend, and percentage change.

Prioritize squat, bench press, deadlift, and overhead press in the UI, while supporting all exercises with valid loaded sets. Add an exercise detail view with e1RM trend, best-set context, and milestone history.

**Acceptance criteria:** The system updates e1RM after a completed set; the user can compare latest versus best e1RM; major compound lifts have dedicated trend visibility; bodyweight or zero-load exercises do not produce misleading loaded e1RM values.

### Release 5 — Volume, intensity, and recovery analytics

**Goal:** Replace the current heatmap-only view with actionable weekly training analysis.

Add selectable time ranges such as 7, 28, and 90 days. Calculate and visualize:

- Weekly hard sets by muscle group.
- Weekly volume load as sets × reps × weight.
- Average and top intensity by muscle group.
- e1RM or top-set trend for selected exercises.
- Volume change versus the prior week.
- Recovery/readiness trend and overreach warnings.

Keep the existing heatmap as the calendar view. Add charts and tables with accessible labels and an explanatory empty state when data is sparse. Avoid implying medical certainty; label readiness as a training heuristic.

**Acceptance criteria:** A user can select a date range and muscle group; weekly volume and hard sets update consistently; the dashboard identifies unusually high or falling volume; each visualization has a text summary and works at mobile widths.

### Release 6 — Multi-week training blocks

**Goal:** Let athletes plan and run structured programs rather than only repeating day-based splits.

Support block creation with duration, goal, and week definitions. Each week can reference a split or contain adjusted prescriptions. Add week-level progression rules, deload flags, and a current-week indicator. Starting a workout from a block should select the correct week prescription automatically.

Provide block actions for duplicate, archive, restart, and advance week. Keep historical completed workouts linked to the prescription that generated them so later edits do not rewrite history.

**Acceptance criteria:** A user can create a 4–12 week block, assign weekly prescriptions, start the current week’s workout, advance or deload, and review past weeks without losing completed history.

### Release 7 — Rest timers and program templates

**Goal:** Improve execution quality during a session and reduce setup time for repeat programming.

Add configurable rest seconds to each exercise prescription, with sensible defaults based on movement type. In the workout logger, provide a start/pause/reset timer after a set, show the next prescribed rest duration, and allow an in-session override without changing the program default.

Add template operations: duplicate an existing split or block, rename the copy, adjust days and prescriptions, and save reusable user-owned templates. Consider a small set of immutable starter templates only after the user-owned flow is stable.

**Acceptance criteria:** Rest duration is configurable per exercise; the timer survives UI rerenders during the active workout; users can duplicate and edit a program without changing the original; template-derived workouts remain linked to their own immutable prescription snapshot.

## Cross-cutting engineering requirements

### Data and safety

All new tables and fields must use additive migrations. Every query must scope by authenticated user ID. Completed workout history is immutable from the UI. Recommendation calculations must never mutate workout data automatically.

### API design

Expose focused protected procedures for recommendation previews, effort summaries, e1RM series, weekly analytics, blocks, templates, and rest-timer preferences. Return typed reason codes and human-readable explanations rather than opaque strings only.

### Testing strategy

Maintain three layers:

1. Pure unit tests for progression math, RPE/RIR conversion, e1RM formulas, volume aggregation, deload detection, and milestone logic.
2. Protected API tests proving user isolation, migration-compatible defaults, and recommendation payloads.
3. Chromium frontend E2E tests covering authenticated navigation, visible colors and contrast, creating a block, editing a prescription, logging RPE/RIR, accepting a recommendation, starting a rest timer, and exporting analytics/history.

Use seeded deterministic fixtures for E2E data. Do not write arbitrary production-like test data into the shared managed database unless the test environment and cleanup behavior are explicitly isolated.

### Accessibility and UX

Keep keyboard-accessible inputs and controls, visible focus states, semantic table headers, accessible chart summaries, and color-independent states. Recovery and intensity must use labels, patterns, or text in addition to color.

### Release gates

Each release is ready only when TypeScript diagnostics are clean, unit/API tests pass, frontend E2E passes at desktop and mobile viewport sizes, the production build contains a non-empty CSS bundle, the route manifest matches source routes, and the deployed health endpoint is healthy.

## Suggested priority order

If implementation capacity is limited, deliver in this order:

1. Data foundation and measurement quality.
2. Advanced overload engine.
3. RPE/RIR auto-regulation.
4. Live 1RM and performance intelligence.
5. Weekly volume/intensity analytics.
6. Multi-week blocks.
7. Rest timers and template duplication.

This order ensures that program planning is built on trustworthy measurements and explainable recommendations rather than adding UI complexity before the training logic is reliable.
