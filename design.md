# Gym Progress Pro - Mobile App Design

## Overview
Gym Progress Pro is a science-based gym progress tracking app that helps users log exercises, receive progression recommendations, and visualize their weekly progress through charts.

## Screen List

1. **Onboarding / Initial Setup** - User enters initial exercise data (reps, weight, sets)
2. **Home Dashboard** - Overview of recent workouts and weekly progress summary
3. **Workout Splits** - Browse and select from pre-built workout splits (Push/Pull/Legs, Upper/Lower, Full Body, etc.)
4. **Exercise Logger** - Log current exercise performance (weight, reps, sets)
5. **Progression Recommendations** - AI-generated progression suggestions based on science-based models
6. **Progress Charts** - Weekly/monthly graphical visualization of progress (line charts, bar charts)
7. **Workout History** - List of past workouts with details
8. **Settings** - App preferences and profile management

## Primary Content and Functionality

### Home Dashboard
- **Quick Stats Card**: Current week's total volume, average weight, workouts completed
- **Recent Workout List**: Last 3-5 workouts with date, exercise name, weight, reps, sets
- **Weekly Progress Chart**: Mini line chart showing total volume progression over 7 days
- **Action Buttons**: "Log Workout", "View Splits", "See Recommendations"

### Workout Splits
- **Split Cards**: Horizontal scrollable list of workout splits (PPL, Upper/Lower, Full Body, Bro Split)
- **Split Details**: Shows exercises in each split, frequency per week
- **Select Split**: User can select a split to start logging workouts
- **Custom Split Option**: Option to create custom splits

### Exercise Logger
- **Exercise Selection**: Dropdown or search to select exercise (Squat, Bench Press, Deadlift, etc.)
- **Input Fields**: Weight (kg/lbs), Reps, Sets, RPE (Rate of Perceived Exertion 1-10)
- **Progression Indicator**: Shows previous session's weight/reps for comparison
- **Submit Button**: Save workout entry

### Progression Recommendations
- **Exercise Card**: Shows current performance (weight, reps, sets)
- **Recommendation Box**: 
  - Suggested weight increase (e.g., "+2.5kg")
  - Suggested rep range (e.g., "8-10 reps")
  - Progression strategy (Linear, Double Progression, RPE-based)
  - Science explanation: Brief note on why this progression is recommended
- **Accept/Modify**: User can accept recommendation or manually adjust

### Progress Charts
- **Chart Type Toggle**: Switch between Weekly, Monthly, All-Time views
- **Line Chart**: Total volume (weight × reps × sets) over time
- **Bar Chart**: Volume per exercise
- **Data Points**: Hover/tap to see exact values
- **Trend Indicator**: Up/down arrow showing progress direction

### Workout History
- **List View**: All past workouts sorted by date (newest first)
- **Workout Card**: Date, exercise name, weight, reps, sets, RPE
- **Filter**: Filter by exercise type or date range
- **Edit/Delete**: Ability to modify or remove entries

## Key User Flows

### Flow 1: Initial Setup & First Workout
1. User opens app → Onboarding screen
2. Selects workout split (PPL, Upper/Lower, etc.)
3. Logs initial exercise data (Squat: 100kg, 8 reps, 3 sets)
4. App stores baseline data
5. Redirected to Home Dashboard

### Flow 2: Log Daily Workout
1. User taps "Log Workout" on Home
2. Selects exercise from split
3. Enters weight, reps, sets, RPE
4. Taps "Save"
5. App shows progression recommendation
6. User can accept or modify
7. Returns to Home Dashboard

### Flow 3: View Progress
1. User taps "Progress Charts" on Home
2. Selects time range (Weekly/Monthly)
3. Views line chart of volume progression
4. Taps on data point to see details
5. Swipes to view different exercises

### Flow 4: Get Progression Advice
1. User taps "Recommendations" on Home
2. App shows all exercises with current performance
3. For each exercise, displays:
   - Current: 100kg × 8 reps × 3 sets
   - Recommended: 102.5kg × 8 reps × 3 sets (Linear progression)
   - Rationale: "You completed all reps with RPE 7, ready to add 2.5kg"
4. User can accept or customize recommendations

## Color Choices

| Element | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Primary (Accent) | #0a7ea4 (Teal) | #0a7ea4 (Teal) | Buttons, highlights, active states |
| Background | #ffffff (White) | #151718 (Dark Gray) | Screen background |
| Surface | #f5f5f5 (Light Gray) | #1e2022 (Darker Gray) | Cards, elevated surfaces |
| Foreground (Text) | #11181C (Dark Gray) | #ECEDEE (Light Gray) | Primary text |
| Muted (Secondary Text) | #687076 (Medium Gray) | #9BA1A6 (Light Gray) | Secondary text, hints |
| Success | #22C55E (Green) | #4ADE80 (Light Green) | Progress indicators, achievements |
| Warning | #F59E0B (Amber) | #FBBF24 (Light Amber) | Cautions, form validation |
| Error | #EF4444 (Red) | #F87171 (Light Red) | Errors, dangerous actions |
| Border | #E5E7EB (Light Gray) | #334155 (Dark Slate) | Dividers, borders |

## Interaction Patterns

- **Press Feedback**: Buttons scale to 0.97 with light haptic feedback
- **List Items**: Opacity change to 0.7 on press
- **Loading States**: Spinner with "Loading..." text
- **Success Feedback**: Green checkmark + success haptic
- **Error Feedback**: Red error message + error haptic

## Design Principles

1. **One-Handed Usage**: All interactive elements within thumb reach (bottom 60% of screen)
2. **iOS-First Design**: Follow Apple HIG for navigation, spacing, and interactions
3. **Data Visualization**: Charts should be clear and tap-friendly
4. **Progressive Disclosure**: Show essential info first, details on demand
5. **Accessibility**: High contrast text, large touch targets (44pt minimum)
