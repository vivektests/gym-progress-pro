export type EffortSource = "rpe" | "rir" | "none";
export type AutoRegulationAction = "increase_load" | "add_reps" | "hold_load" | "reduce_load" | "deload_sets";

export type EffortObservation = {
  rpe?: number | null;
  rir?: number | null;
  reps: number;
  weight: number;
};

export type AutoRegulationInput = {
  targetRpe?: number | null;
  targetRir?: number | null;
  loadIncrement: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  currentLoad: number;
  latest: EffortObservation[];
  previous?: EffortObservation[][];
};

export type NormalizedEffort = {
  rpe: number;
  rir: number;
  source: Exclude<EffortSource, "none">;
};

export function validateEffort(rpe?: number | null, rir?: number | null) {
  if (rpe != null && rir != null) return "Enter either RPE or RIR for a set, not both.";
  if (rpe != null && (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)) return "RPE must be between 0 and 10.";
  if (rir != null && (!Number.isFinite(rir) || rir < 0 || rir > 6)) return "RIR must be between 0 and 6.";
  return null;
}

export function normalizeEffort(rpe?: number | null, rir?: number | null): NormalizedEffort | null {
  if (validateEffort(rpe, rir)) return null;
  if (rpe != null) return { rpe, rir: 10 - rpe, source: "rpe" };
  if (rir != null) return { rpe: 10 - rir, rir, source: "rir" };
  return null;
}

function median(values: number[]) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function round(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function autoRegulationFor(input: AutoRegulationInput) {
  const observations = input.latest.map(item => ({ item, effort: normalizeEffort(item.rpe, item.rir) })).filter((item): item is { item: EffortObservation; effort: NormalizedEffort } => item.effort != null);
  const effortRpe = median(observations.map(item => item.effort.rpe));
  const effortRir = effortRpe == null ? null : round(10 - effortRpe);
  const targetRpe = input.targetRpe ?? (input.targetRir == null ? 8 : 10 - input.targetRir);
  const targetRir = input.targetRir ?? 10 - targetRpe;
  const averageReps = input.latest.length ? input.latest.reduce((sum, item) => sum + item.reps, 0) / input.latest.length : 0;
  const topRepSets = input.latest.length >= input.targetSets && input.latest.every(item => item.reps >= input.repMax);
  const previousReps = (input.previous || []).flat().map(item => item.reps);
  const previousAverageReps = previousReps.length ? previousReps.reduce((sum, reps) => sum + reps, 0) / previousReps.length : null;
  const performanceDecline = previousAverageReps != null && averageReps <= previousAverageReps - 1;
  const highEffort = effortRpe != null && effortRpe >= targetRpe + 0.8;
  const zeroReserve = effortRir != null && effortRir <= 0.5;
  const lowEffort = effortRpe != null && effortRpe <= targetRpe - 0.8;
  const severeFatigue = (highEffort || zeroReserve) && performanceDecline;
  const source: EffortSource = observations[0]?.effort.source || "none";
  let action: AutoRegulationAction = "hold_load";
  let proposedLoad = input.currentLoad;
  let proposedSets = input.targetSets;
  let proposedRepMin = input.repMin;
  let proposedRepMax = input.repMax;
  let adjustmentKg = 0;
  let reasonCode = "steady";
  let reason = "Keep the chosen load and aim for the prescribed range.";

  if (severeFatigue) {
    action = "deload_sets";
    reasonCode = "repeated_fatigue";
    adjustmentKg = -input.loadIncrement;
    proposedLoad = Math.max(0, input.currentLoad + adjustmentKg);
    proposedSets = Math.max(1, input.targetSets - 1);
    reason = `Effort is above target and average reps fell from ${round(previousAverageReps!)} to ${round(averageReps)}; reduce one set and rebuild at a lighter load.`;
  } else if (highEffort || zeroReserve) {
    action = "reduce_load";
    reasonCode = zeroReserve ? "zero_reserve" : "high_effort";
    adjustmentKg = -input.loadIncrement;
    proposedLoad = Math.max(0, input.currentLoad + adjustmentKg);
    proposedRepMin = Math.max(1, input.repMin - 1);
    proposedRepMax = Math.max(proposedRepMin, input.repMax - 1);
    reason = zeroReserve ? "A set reached zero reps in reserve; reduce the next target and leave room for quality reps." : `Median effort was ${round(effortRpe!)} RPE, above the ${targetRpe.toFixed(1)} target; reduce the next load by ${round(input.loadIncrement)} kg.`;
  } else if (topRepSets && lowEffort) {
    action = "increase_load";
    reasonCode = "under_target_effort";
    adjustmentKg = input.loadIncrement;
    proposedLoad = input.currentLoad + adjustmentKg;
    reason = `The top of the rep range was completed at ${round(effortRpe!)} RPE; add ${round(input.loadIncrement)} kg while staying near the effort target.`;
  } else if (lowEffort && averageReps >= input.repMin) {
    action = "add_reps";
    reasonCode = "add_reps_before_load";
    proposedRepMin = Math.min(input.repMax, input.repMin + 1);
    reason = `Median effort was ${round(effortRpe!)} RPE, so add one controlled rep before changing load.`;
  } else if (performanceDecline) {
    action = "hold_load";
    reasonCode = "performance_decline";
    reason = `Average reps are down from ${round(previousAverageReps!)} to ${round(averageReps)}; hold the chosen load and prioritize clean reps.`;
  }

  return {
    action, reasonCode, reason, source, targetRpe: round(targetRpe), targetRir: round(targetRir), observedRpe: effortRpe == null ? null : round(effortRpe), observedRir: effortRir,
    chosenLoad: round(input.currentLoad), proposedLoad: round(proposedLoad), adjustmentKg: round(adjustmentKg), proposedSets, proposedRepMin, proposedRepMax,
    manualAcceptanceRequired: true,
    evidence: { setsObserved: input.latest.length, averageReps: round(averageReps), previousAverageReps: previousAverageReps == null ? null : round(previousAverageReps), performanceDecline, topRepSets },
  };
}
