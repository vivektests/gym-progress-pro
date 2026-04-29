/**
 * Predefined workout splits and exercise database
 */

import type { WorkoutSplit, Exercise } from './types';

/**
 * Exercise Database - Common gym exercises
 */
export const EXERCISE_DATABASE: Exercise[] = [
  // Compound Movements
  { id: 'squat', name: 'Barbell Squat', category: 'compound' },
  { id: 'bench_press', name: 'Barbell Bench Press', category: 'compound' },
  { id: 'deadlift', name: 'Deadlift', category: 'compound' },
  { id: 'overhead_press', name: 'Overhead Press', category: 'compound' },
  { id: 'bent_row', name: 'Bent Over Row', category: 'compound' },
  { id: 'pull_ups', name: 'Pull-ups', category: 'compound' },
  { id: 'dips', name: 'Dips', category: 'compound' },

  // Isolation - Chest
  { id: 'incline_bench', name: 'Incline Bench Press', category: 'isolation' },
  { id: 'dumbbell_press', name: 'Dumbbell Bench Press', category: 'isolation' },
  { id: 'cable_fly', name: 'Cable Flyes', category: 'isolation' },
  { id: 'machine_chest', name: 'Machine Chest Press', category: 'isolation' },

  // Isolation - Back
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'isolation' },
  { id: 'seated_row', name: 'Seated Row', category: 'isolation' },
  { id: 'machine_row', name: 'Machine Row', category: 'isolation' },
  { id: 'face_pull', name: 'Face Pulls', category: 'isolation' },

  // Isolation - Shoulders
  { id: 'lateral_raise', name: 'Lateral Raises', category: 'isolation' },
  { id: 'front_raise', name: 'Front Raises', category: 'isolation' },
  { id: 'reverse_pec_deck', name: 'Reverse Pec Deck', category: 'isolation' },
  { id: 'machine_shoulder', name: 'Machine Shoulder Press', category: 'isolation' },

  // Isolation - Arms
  { id: 'barbell_curl', name: 'Barbell Curl', category: 'isolation' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', category: 'isolation' },
  { id: 'tricep_rope', name: 'Tricep Rope Pushdown', category: 'isolation' },
  { id: 'tricep_dips', name: 'Tricep Dips', category: 'isolation' },
  { id: 'ez_bar_curl', name: 'EZ Bar Curl', category: 'isolation' },
  { id: 'overhead_extension', name: 'Overhead Tricep Extension', category: 'isolation' },

  // Isolation - Legs
  { id: 'leg_press', name: 'Leg Press', category: 'isolation' },
  { id: 'leg_curl', name: 'Leg Curl', category: 'isolation' },
  { id: 'leg_extension', name: 'Leg Extension', category: 'isolation' },
  { id: 'calf_raise', name: 'Calf Raises', category: 'isolation' },
  { id: 'hack_squat', name: 'Hack Squat', category: 'isolation' },

  // Isolation - Core
  { id: 'cable_crunch', name: 'Cable Crunch', category: 'isolation' },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', category: 'isolation' },
];

/**
 * Workout Split Templates
 */
export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'ppl',
    name: 'Push/Pull/Legs',
    type: 'ppl',
    description: 'Train push muscles (chest, shoulders, triceps), pull muscles (back, biceps), and legs on separate days.',
    daysPerWeek: 6,
    days: [
      {
        id: 'push',
        name: 'Push',
        exercises: ['bench_press', 'incline_bench', 'overhead_press', 'lateral_raise', 'tricep_rope', 'cable_fly'],
      },
      {
        id: 'pull',
        name: 'Pull',
        exercises: ['deadlift', 'bent_row', 'pull_ups', 'lat_pulldown', 'barbell_curl', 'face_pull'],
      },
      {
        id: 'legs',
        name: 'Legs',
        exercises: ['squat', 'leg_press', 'leg_curl', 'leg_extension', 'calf_raise', 'ab_wheel'],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper/Lower Split',
    type: 'upper-lower',
    description: 'Alternate between upper body (chest, back, shoulders, arms) and lower body (quads, hamstrings, glutes, calves) workouts.',
    daysPerWeek: 4,
    days: [
      {
        id: 'upper',
        name: 'Upper',
        exercises: ['bench_press', 'bent_row', 'overhead_press', 'pull_ups', 'lateral_raise', 'barbell_curl'],
      },
      {
        id: 'lower',
        name: 'Lower',
        exercises: ['squat', 'deadlift', 'leg_press', 'leg_curl', 'calf_raise', 'ab_wheel'],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    type: 'full-body',
    description: 'Train all major muscle groups in each session. Ideal for beginners and time-constrained lifters.',
    daysPerWeek: 3,
    days: [
      {
        id: 'full_body_a',
        name: 'Full Body A',
        exercises: ['squat', 'bench_press', 'bent_row', 'overhead_press', 'leg_curl', 'barbell_curl'],
      },
      {
        id: 'full_body_b',
        name: 'Full Body B',
        exercises: ['deadlift', 'incline_bench', 'pull_ups', 'lateral_raise', 'leg_press', 'tricep_rope'],
      },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    type: 'bro-split',
    description: 'Dedicate each day to a single muscle group. Allows high volume per muscle but requires 5-6 days per week.',
    daysPerWeek: 5,
    days: [
      {
        id: 'chest',
        name: 'Chest',
        exercises: ['bench_press', 'incline_bench', 'dumbbell_press', 'cable_fly', 'machine_chest'],
      },
      {
        id: 'back',
        name: 'Back',
        exercises: ['deadlift', 'bent_row', 'pull_ups', 'lat_pulldown', 'seated_row'],
      },
      {
        id: 'shoulders',
        name: 'Shoulders',
        exercises: ['overhead_press', 'lateral_raise', 'front_raise', 'reverse_pec_deck', 'machine_shoulder'],
      },
      {
        id: 'arms',
        name: 'Arms',
        exercises: ['barbell_curl', 'dumbbell_curl', 'tricep_rope', 'tricep_dips', 'ez_bar_curl'],
      },
      {
        id: 'legs',
        name: 'Legs',
        exercises: ['squat', 'leg_press', 'leg_curl', 'leg_extension', 'calf_raise'],
      },
    ],
  },
];

/**
 * Get split by ID
 */
export function getSplitById(id: string): WorkoutSplit | undefined {
  return WORKOUT_SPLITS.find((split) => split.id === id);
}

/**
 * Get exercise by ID
 */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find((ex) => ex.id === id);
}

/**
 * Get all exercises for a split
 */
export function getExercisesForSplit(splitId: string): Exercise[] {
  const split = getSplitById(splitId);
  if (!split) return [];

  const exerciseIds = new Set<string>();
  split.days.forEach((day) => {
    day.exercises.forEach((id) => exerciseIds.add(id));
  });

  return Array.from(exerciseIds)
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex !== undefined);
}
