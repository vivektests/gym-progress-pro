export type OneRepMaxFormula = "epley" | "brzycki";

export type StrengthSet = {
  weight: number;
  reps: number;
};

export function estimateOneRepMax(weight: number, reps: number, formula: OneRepMaxFormula = "epley") {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps < 1 || reps > 30) return null;
  const estimate = formula === "brzycki" && reps > 1 ? weight * (36 / (37 - reps)) : weight * (1 + reps / 30);
  return Math.round(estimate * 10) / 10;
}

export function isLoadedSet(weight: number, reps: number) {
  return estimateOneRepMax(weight, reps) != null;
}

export function percentOfBest(latest: number | null, best: number | null) {
  if (latest == null || best == null || best <= 0) return 0;
  return Math.round((latest / best) * 100);
}

export function compoundLiftBucket(name: string) {
  const value = name.toLowerCase();
  if (value.includes("squat")) return "Squat" as const;
  if (value.includes("bench")) return "Bench Press" as const;
  if (value.includes("deadlift") || value.includes("dead lift")) return "Deadlift" as const;
  if (value.includes("overhead press") || value.includes("shoulder press") || value.includes("military press")) return "Overhead Press" as const;
  return null;
}

export function weekStartKey(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start.toISOString().slice(0, 10);
}
