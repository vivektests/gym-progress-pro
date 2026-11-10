import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { recommendationFor } from "../shared/recommendations";
import { milestoneProgress, normalizeMuscleGroup, recoveryState } from "../shared/analytics";
import { historyToCsv } from "../shared/exports";

describe("Gym Progress Pro critical flows", () => {
  it("recommends a measured load increase after a strong rep set", () => {
    expect(recommendationFor({ exerciseName: "Bench Press", weight: 80, reps: 10 })).toContain("82.5 kg");
  });

  it("keeps the load stable when the athlete needs another clean rep", () => {
    expect(recommendationFor({ exerciseName: "Squat", weight: 100, reps: 6 })).toContain("Keep 100 kg");
  });

  it("declares every protected page in the route manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "client/public/manus-routes.json"), "utf8"));
    const paths = manifest.routes.map((route: { path: string }) => route.path);
    expect(paths).toEqual(expect.arrayContaining(["/", "/splits", "/workout/new", "/workout/:id", "/progress", "/analytics", "/history", "/history/:id", "/settings", "/404"]));
  });

  it("maps exercise labels into stable muscle buckets", () => {
    expect(normalizeMuscleGroup("Posterior chain")).toBe("Hamstrings");
    expect(normalizeMuscleGroup("Chest")).toBe("Chest");
  });

  it("scores recovery lower after recent high-volume work", () => {
    expect(recoveryState(6, 18).label).toBe("Recovering");
    expect(recoveryState(0, null).label).toBe("Ready");
  });

  it("calculates the next load milestone", () => {
    expect(milestoneProgress(80)).toMatchObject({ next: 85, remaining: 5 });
  });

  it("exports history as escaped CSV with workout summaries", () => {
    const csv = historyToCsv([{ name: "Legs, heavy", completedAt: "2026-11-10T10:00:00.000Z", totalSets: 12, totalVolume: 1234.6, notes: "Felt strong\nkeep this" }]);
    expect(csv).toContain("Session,Completed date,Total sets,Total volume (kg),Notes");
    expect(csv).toContain('"Legs, heavy"');
    expect(csv).toContain('"Felt strong\nkeep this"');
    expect(csv).toContain(",1235,");
  });
});
