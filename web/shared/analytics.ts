export const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Biceps", "Triceps", "Core"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export function normalizeMuscleGroup(label: string): MuscleGroup {
  const value = label.toLowerCase();
  if (value.includes("chest")) return "Chest";
  if (value.includes("back") || value.includes("lat")) return "Back";
  if (value.includes("shoulder") || value.includes("delt")) return "Shoulders";
  if (value.includes("quad") || value.includes("glute")) return "Quads";
  if (value.includes("hamstring") || value.includes("posterior") || value.includes("calf")) return "Hamstrings";
  if (value.includes("bicep") || value.includes("curl")) return "Biceps";
  if (value.includes("tricep")) return "Triceps";
  if (value.includes("core") || value.includes("ab")) return "Core";
  return "Core";
}

export function recoveryState(recentSets: number, hoursSinceLastSession: number | null) {
  if (hoursSinceLastSession === null) return { score: 100, label: "Ready", tone: "ready" as const };
  const restBonus = Math.max(0, hoursSinceLastSession - 24) * 1.15;
  const score = Math.max(18, Math.min(100, Math.round(100 - recentSets * 14 + restBonus)));
  if (score < 48) return { score, label: "Recovering", tone: "recovering" as const };
  if (score < 76) return { score, label: "Ready soon", tone: "soon" as const };
  return { score, label: "Ready", tone: "ready" as const };
}

export function milestoneProgress(bestWeight: number) {
  if (bestWeight <= 0) return { current: 0, next: 5, percent: 0, remaining: 5 };
  const step = bestWeight < 50 ? 2.5 : 5;
  const next = Math.ceil((bestWeight + 0.01) / step) * step;
  const previous = Math.max(0, next - step);
  const percent = Math.max(8, Math.min(99, Math.round(((bestWeight - previous) / (next - previous)) * 100)));
  return { current: bestWeight, next, percent, remaining: Number((next - bestWeight).toFixed(1)) };
}

export function volumeSignal(changePct: number, currentVolume: number, priorVolume: number) {
  if (currentVolume === 0 && priorVolume === 0) return { tone: "neutral" as const, label: "No volume signal", message: "Complete a loaded workout to establish a comparison." };
  if (changePct >= 30) return { tone: "high" as const, label: "Volume spike", message: `Volume is up ${changePct}% versus the comparison window; monitor recovery before adding more work.` };
  if (changePct <= -30) return { tone: "falling" as const, label: "Volume falling", message: `Volume is down ${Math.abs(changePct)}% versus the comparison window; rebuild gradually rather than chasing missed work.` };
  return { tone: "steady" as const, label: "Volume steady", message: "Training load is within the recent comparison band." };
}
