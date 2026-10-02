# Gym Progress Pro - Project TODO

## Core Features

### Phase 1: Foundation & Data Models
- [x] Set up data models for exercises, workouts, and progression history
- [x] Implement local storage (AsyncStorage) for workout data
- [x] Create progression engine with science-based algorithms (Linear, Double Progression, RPE-based)
- [x] Build workout split templates (PPL, Upper/Lower, Full Body, Bro Split)

### Phase 2: Core UI & Navigation
- [x] Create tab navigation structure (Home, Splits, Logger, Progress, History)
- [x] Design and implement Home Dashboard screen
- [x] Design and implement Workout Splits screen
- [x] Design and implement Exercise Logger screen
- [x] Design and implement Progress Charts screen
- [x] Design and implement Workout History screen
- [ ] Design and implement Settings screen

### Phase 3: Exercise Logging & Recommendations
- [x] Implement exercise input form with weight, reps, sets, RPE fields
- [x] Create progression recommendation engine
- [x] Display progression suggestions with science-based explanations
- [ ] Implement accept/modify recommendation flow
- [x] Add exercise database with common gym exercises

### Phase 4: Progress Visualization
- [x] Implement weekly progress chart (line chart - volume over time)
- [ ] Implement monthly progress chart
- [ ] Implement per-exercise progress visualization
- [ ] Add chart interactivity (tap for details, swipe between exercises)
- [x] Display trend indicators (progress metrics and growth)

### Phase 5: Onboarding & Initial Setup
- [ ] Create onboarding flow for first-time users
- [ ] Implement initial exercise data collection
- [ ] Allow workout split selection during onboarding
- [ ] Store baseline data for progression calculations

### Phase 6: Polish & Testing
- [ ] Add haptic feedback for interactions
- [x] Implement dark mode support (via theme provider)
- [ ] Test all user flows end-to-end
- [ ] Optimize performance for large workout histories
- [ ] Add error handling and validation

## Branding & Assets
- [x] Generate custom app logo reflecting gym/fitness theme
- [x] Update app.config.ts with app name and logo URL
- [x] Create splash screen icon
- [x] Create Android adaptive icon

## Known Issues & Bugs
- Server-side TypeScript error in storageProxy.ts (not related to mobile app code)

## Notes
- Using science-based progression models from Stronger by Science research
- Progressive overload principles: Linear progression, Double progression, RPE-based autoregulation, APRE
- Target audience: Fitness enthusiasts wanting data-driven progression tracking
- App features 5 main tabs: Home (dashboard), Splits (workout templates), Logger (exercise input), Progress (charts), History (past workouts)
- Progression algorithms: Linear (2.5-5kg increments), Double (reps then weight), RPE-based (autoregulatory), APRE (performance-based)

## GitHub Publishing
- [ ] Create or connect a GitHub repository and push the current Gym Progress Pro code
- [ ] Verify the remote and document the push-after-update workflow
