# Gym Progress Pro

Gym Progress Pro is an Expo and React Native mobile app for logging gym workouts, tracking volume over time, and making science-informed progression decisions. It combines practical workout tracking with progression models inspired by exercise-science practice, including linear progression, double progression, RPE-based autoregulation, and APRE-style recommendations.

## What it does

- **Log workouts:** Record exercise, weight, reps, sets, RPE, and notes.
- **Track daily training:** See the exercises and total volume recorded for the current day.
- **Progress recommendations:** Generate a next-session progression rationale from the current performance and optional RPE.
- **Choose a workout split:** Select from built-in Push/Pull/Legs, Upper/Lower, Full Body, and Bro Split templates.
- **Create custom exercises:** Add compound, isolation, or cardio movements that are not in the built-in library. Custom exercises are persisted locally and appear in the logger alongside built-in exercises.
- **Review history:** Browse saved workout sessions and exercise-level performance.
- **Visualize progress:** Review weekly volume and progress metrics.
- **Use light or dark mode:** The interface follows the app theme provider and shared design tokens.

> **Important:** This app provides training suggestions, not medical advice. Progression should be adjusted for the individual’s goals, training age, technique, recovery, pain, and guidance from a qualified professional.

## Progression models

The progression engine lives in `lib/progression.ts` and exposes reusable functions:

- **Linear progression:** Adds a fixed weight increment, scaled by movement type and optional RPE.
- **Double progression:** Increases reps within a target range before adding weight and resetting reps.
- **RPE-based progression:** Uses a 1–10 effort rating to determine whether to maintain, add a small increment, or add more load.
- **APRE-style progression:** Uses performance on the final set to select a next-session weight adjustment.
- **Volume progression:** Compares current and previous volume against a 5–10% weekly progression target.

These are educational heuristics implemented in code. They are not a substitute for individualized programming or clinical advice.

## Tech stack

- **Expo SDK 54**
- **React Native 0.81** and **React 19**
- **Expo Router 6** for file-based navigation
- **TypeScript 5.9** with strict checking
- **NativeWind 4** and Tailwind CSS for styling
- **AsyncStorage** for local workout, exercise, split, and profile persistence
- **TanStack Query** and tRPC scaffold for server-connected features
- **Vitest** for tests
- **Drizzle** for the included database scaffold

## Project structure

```text
app/
  _layout.tsx              Root providers and navigation
  (tabs)/
    _layout.tsx            Bottom tab configuration
    index.tsx              Home dashboard
    splits.tsx             Workout split selection
    logger.tsx             Workout logger and recommendations
    progress.tsx           Progress charts and metrics
    history.tsx            Workout history
    settings.tsx           Custom exercise management route
components/                Shared UI components
hooks/                     Theme and auth hooks
lib/
  types.ts                 Shared domain types
  storage.ts               AsyncStorage persistence wrappers
  workout-data.ts          Built-in exercises and workout splits
  progression.ts           Progression recommendation algorithms
  analytics.ts             Volume and progress calculations
server/                    API, auth, storage, and database scaffold
shared/                    Shared client/server constants and types
assets/images/             App branding and launcher assets
```

## Getting started

### Prerequisites

- Node.js 22 or a compatible current Node.js release
- pnpm 9 or newer
- Expo tooling available through the project dependencies
- Android Studio for Android development or Xcode for iOS development

### Install dependencies

```bash
pnpm install
```

### Start development

The default development command starts the API server and Expo web/Metro process together:

```bash
pnpm dev
```

Useful alternatives:

```bash
pnpm dev:server   # Start the server only
pnpm dev:metro    # Start Expo web/Metro only
pnpm android      # Start the Android target
pnpm ios          # Start the iOS target
```

### Validate the project

```bash
pnpm check        # TypeScript, no emit
pnpm lint         # Expo lint rules
pnpm test         # Vitest test suite
pnpm build        # Bundle the server
```

Run the relevant checks after every feature change. For UI changes, also verify the affected route at a mobile-sized viewport or on a simulator/device.

## Local data model

The app stores local data through `lib/storage.ts` using AsyncStorage. The main records are:

- `Exercise`: an exercise definition with ID, name, category, and optional description.
- `ExerciseLog`: a logged movement with weight, reps, sets, RPE, notes, and timestamp.
- `WorkoutSession`: a dated collection of exercise logs with calculated total volume.
- `WorkoutSplit`: a named template containing training days and exercise IDs.
- `UserProfile`: units, selected split, progression preference, and workout metadata.

Custom exercise IDs are prefixed with `custom_` so they remain distinguishable from built-in exercise IDs. The logger reloads custom exercises when the screen receives focus so additions made in Settings become available without restarting the app.

## Adding a new built-in exercise or split

1. Add the typed record to `lib/workout-data.ts`.
2. Use a stable, descriptive ID because workout logs store the exercise ID.
3. Add the exercise ID to the relevant `WorkoutSplit.days` entry.
4. Run `pnpm check` and verify the Splits and Logger routes.

For a new tab or tab icon:

1. Add the icon name-to-Material-Icon mapping in `components/ui/icon-symbol.tsx`.
2. Add exactly one `Tabs.Screen` entry in `app/(tabs)/_layout.tsx`.
3. Confirm the route file exists and the tab is readable in both themes.

## Development conventions

- Use `ScreenContainer` for screen-level safe-area handling.
- Reuse theme tokens such as `background`, `surface`, `foreground`, `muted`, `primary`, `border`, `success`, `warning`, and `error`.
- Keep storage reads and writes behind the storage layer rather than calling AsyncStorage throughout the UI.
- Validate required numeric inputs and reject missing or non-positive values.
- Keep destructive actions cancellable and synchronize storage state with UI state.
- Avoid hard-coded placeholder metrics when real data is unavailable; show an empty state instead.
- Do not commit secrets or edit `.env` files directly.

## Roadmap

Planned improvements include:

- Custom split builder with user-defined days and exercise order.
- Accept/modify controls for applying progression recommendations quickly.
- More detailed per-exercise and monthly progress charts.
- Onboarding for units, experience level, baseline lifts, and split selection.
- More comprehensive end-to-end testing across Android, iOS, and web.
- Optional authenticated sync for users who want their data across devices.

## License

Gym Progress Pro is released under the MIT License. See [`LICENSE`](./LICENSE) for the full text.
