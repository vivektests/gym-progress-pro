import { autoRegulationFor } from "./autoregulation";

export type ProgressionStrategy = "double_progression" | "rpe_autoregulation" | "fixed_load";

export type Prescription = {
  targetSets: number;
  targetReps: string;
  targetRpeTenth?: number | null;
  targetRirTenth?: number | null;
  repMin?: number | null;
  repMax?: number | null;
  loadIncrementTenth?: number | null;
  progressionStrategy?: string | null;
};

export type HistoricalSet = {
  weight: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
};

export type ProgressionInput = {
  exerciseName: string;
  prescription: Prescription;
  sessions: HistoricalSet[][];
};

function rangeFromPrescription(prescription: Prescription) {
  const parsed = prescription.targetReps.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  const fallback = Number(prescription.targetReps.match(/\d+/)?.[0] || 8);
  return {
    min: parsed ? Number(parsed[1]) : (prescription.repMin ?? fallback),
    max: parsed ? Number(parsed[2]) : (prescription.repMax ?? fallback),
  };
}

function roundLoad(tenth: number) {
  return Math.round(tenth) / 10;
}

export function progressionPlanFor(input: ProgressionInput) {
  const { min, max } = rangeFromPrescription(input.prescription);
  const strategy = (input.prescription.progressionStrategy || "double_progression") as ProgressionStrategy;
  const incrementTenth = input.prescription.loadIncrementTenth ?? 25;
  const latest = input.sessions[0] || [];
  const previous = input.sessions.slice(1, 4).flat();
  const latestWeightTenth = latest.length ? Math.max(...latest.map(set => Math.round(set.weight * 10))) : 0;
  const latestAverageReps = latest.length ? latest.reduce((sum, set) => sum + set.reps, 0) / latest.length : 0;
  const effortValues = latest.map(set => set.rpe ?? (set.rir == null ? null : 10 - set.rir)).filter((value): value is number => value != null);
  const averageEffort = effortValues.length ? effortValues.reduce((sum, value) => sum + value, 0) / effortValues.length : null;
  const targetRir = input.prescription.targetRirTenth == null ? null : input.prescription.targetRirTenth / 10;
  const targetRpe = input.prescription.targetRpeTenth == null ? (targetRir == null ? 8 : 10 - targetRir) : input.prescription.targetRpeTenth / 10;
  const targetEffort = targetRpe;
  const sessionsCompleted = input.sessions.length;
  const bestRecentWeightTenth = Math.max(latestWeightTenth, ...previous.map(set => Math.round(set.weight * 10)));
  const autoregulation = autoRegulationFor({ targetRpe, targetRir, loadIncrement: roundLoad(incrementTenth), targetSets: input.prescription.targetSets, repMin: min, repMax: max, currentLoad: roundLoad(latestWeightTenth), latest, previous: input.sessions.slice(1, 4) });

  if (!latest.length) {
    return {
      exerciseName: input.exerciseName, strategy, targetSets: input.prescription.targetSets, targetRepMin: min, targetRepMax: max,
      targetWeight: 0, targetRpe, targetRir, confidence: "baseline" as const, sessionsCompleted,
      recommendation: `Start at a conservative baseline for ${input.prescription.targetSets} sets of ${min}-${max} reps.`,
      reason: "No completed history yet; the first clean session establishes your baseline.",
      evidence: { sessionsCompleted, latestWeight: 0, latestAverageReps: 0, averageEffort: null },
      autoregulation,
    };
  }

  const hasEffortSignal = latest.some(set => set.rpe != null || set.rir != null);
  const highEffort = averageEffort != null && averageEffort > targetEffort + 0.4;
  const allSetsAtTop = latest.length >= input.prescription.targetSets && latest.every(set => set.reps >= max);
  const strategyAllowsIncrease = strategy !== "fixed_load";
  let nextWeightTenth = latestWeightTenth;
  let nextMin = min;
  let nextMax = max;
  let confidence: "high" | "medium" | "low" = sessionsCompleted >= 3 ? "high" : "medium";
  let reason = "Keep the current load and build another clean rep before adding weight.";

  if (hasEffortSignal) {
    nextWeightTenth = Math.round(autoregulation.proposedLoad * 10);
    nextMin = autoregulation.proposedRepMin;
    nextMax = autoregulation.proposedRepMax;
    reason = autoregulation.reason;
    if (autoregulation.action === "deload_sets") confidence = "high";
  } else if (highEffort) {
    nextWeightTenth = Math.max(0, latestWeightTenth - incrementTenth);
    nextMin = Math.max(1, min - 1);
    nextMax = Math.max(nextMin, max - 1);
    confidence = "high";
    reason = `Average effort was ${averageEffort?.toFixed(1)} RPE, above the ${targetEffort.toFixed(1)} target; reduce load and rebuild quality.`;
  } else if (allSetsAtTop && strategyAllowsIncrease) {
    nextWeightTenth = latestWeightTenth + incrementTenth;
    reason = `All ${latest.length} sets reached ${max} reps without excessive effort; add ${roundLoad(incrementTenth)} kg and restart the range.`;
  } else if (latestAverageReps >= min) {
    nextMin = Math.min(max, Math.floor(latestAverageReps) + 1);
    nextMax = max;
    reason = `Recent work averaged ${latestAverageReps.toFixed(1)} reps; add one controlled rep before increasing load.`;
  } else {
    confidence = "low";
    reason = `Keep the load stable and aim to reach the ${min}-rep floor across the prescribed sets.`;
  }

  const effortSuffix = targetRir != null ? ` at ${targetRir.toFixed(1)} RIR` : ` around RPE ${targetRpe.toFixed(1)}`;
  return {
    exerciseName: input.exerciseName, strategy, targetSets: hasEffortSignal ? autoregulation.proposedSets : input.prescription.targetSets, targetRepMin: nextMin, targetRepMax: nextMax,
    targetWeight: roundLoad(nextWeightTenth), targetRpe, targetRir, confidence, sessionsCompleted,
    recommendation: `${roundLoad(nextWeightTenth)} kg × ${nextMin}-${nextMax} for ${hasEffortSignal ? autoregulation.proposedSets : input.prescription.targetSets} sets${effortSuffix}.`,
    reason,
    evidence: { sessionsCompleted, latestWeight: roundLoad(latestWeightTenth), bestRecentWeight: roundLoad(bestRecentWeightTenth), latestAverageReps: Math.round(latestAverageReps * 10) / 10, averageEffort: averageEffort == null ? null : Math.round(averageEffort * 10) / 10 },
    autoregulation,
  };
}
