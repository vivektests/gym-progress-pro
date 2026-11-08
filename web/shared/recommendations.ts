export type PerformanceSignal = {
  exerciseName: string;
  weight: number;
  reps: number;
};

export function recommendationFor(signal: PerformanceSignal): string {
  if (signal.reps >= 10) {
    return `Try ${signal.weight + 2.5} kg next time while keeping your reps controlled.`;
  }
  return `Keep ${signal.weight} kg and aim for one more clean rep next time.`;
}
