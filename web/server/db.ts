import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  exercises,
  InsertUser,
  splitDayExercises,
  splitDays,
  splits,
  trainingBlockWeeks,
  trainingBlocks,
  users,
  workoutExercises,
  workoutSets,
  workouts,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { MUSCLE_GROUPS, milestoneProgress, normalizeMuscleGroup, recoveryState } from "../shared/analytics";
import { progressionPlanFor, type HistoricalSet } from "../shared/progression";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const STANDARD_EXERCISES = [
  ["Barbell Back Squat", "Quads", "Barbell"],
  ["Bench Press", "Chest", "Barbell"],
  ["Deadlift", "Posterior chain", "Barbell"],
  ["Overhead Press", "Shoulders", "Barbell"],
  ["Pull-up", "Back", "Bodyweight"],
  ["Barbell Row", "Back", "Barbell"],
  ["Romanian Deadlift", "Hamstrings", "Barbell"],
  ["Bulgarian Split Squat", "Quads", "Dumbbell"],
  ["Incline Dumbbell Press", "Chest", "Dumbbell"],
  ["Cable Row", "Back", "Cable"],
  ["Lateral Raise", "Shoulders", "Dumbbell"],
  ["EZ-Bar Curl", "Biceps", "Barbell"],
] as const;

export async function ensureStandardExercises() {
  const db = await getDb();
  if (!db) return;
  for (const [name, muscleGroup, equipment] of STANDARD_EXERCISES) {
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.name, name), eq(exercises.isStandard, 1)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(exercises).values({ name, muscleGroup, equipment, isStandard: 1 });
    }
  }
}

export async function listExercises(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  await ensureStandardExercises();
  const ownership = or(isNull(exercises.userId), eq(exercises.userId, userId));
  const filter = search?.trim()
    ? and(ownership, like(exercises.name, `%${search.trim()}%`))
    : ownership;
  return db.select().from(exercises).where(filter).orderBy(exercises.name);
}

export async function createExercise(userId: number, input: { name: string; muscleGroup: string; equipment: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(exercises).values({ ...input, userId, isStandard: 0 });
  return Number(result[0].insertId);
}

export async function getExerciseForUser(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), or(isNull(exercises.userId), eq(exercises.userId, userId))))
    .limit(1);
  return result[0];
}

export async function getSplits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const splitRows = await db.select().from(splits).where(eq(splits.userId, userId)).orderBy(desc(splits.updatedAt));
  const result = [];
  for (const split of splitRows) {
    const days = await db.select().from(splitDays).where(and(eq(splitDays.splitId, split.id), eq(splitDays.userId, userId))).orderBy(splitDays.dayOrder);
    const dayDetails = [];
    for (const day of days) {
      const rows = await db
        .select({ prescription: splitDayExercises, exercise: exercises })
        .from(splitDayExercises)
        .innerJoin(exercises, eq(splitDayExercises.exerciseId, exercises.id))
        .where(and(eq(splitDayExercises.splitDayId, day.id), eq(splitDayExercises.userId, userId)))
        .orderBy(splitDayExercises.orderIndex);
      dayDetails.push({ ...day, exercises: rows.map(row => ({ ...row.prescription, exercise: row.exercise })) });
    }
    result.push({ ...split, days: dayDetails });
  }
  return result;
}

export async function createSplit(userId: number, input: { name: string; description?: string; days: Array<{ name: string; focus: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const splitResult = await db.insert(splits).values({ userId, name: input.name, description: input.description ?? null });
  const splitId = Number(splitResult[0].insertId);
  if (input.days.length) {
    await db.insert(splitDays).values(input.days.map((day, index) => ({ userId, splitId, name: day.name, focus: day.focus, dayOrder: index })));
  }
  return splitId;
}

export async function addExerciseToSplitDay(userId: number, input: { splitDayId: number; exerciseId: number; targetSets: number; targetReps: string; targetRpe?: number; targetRir?: number; repMin?: number; repMax?: number; loadIncrement?: number; progressionStrategy?: "double_progression" | "rpe_autoregulation" | "fixed_load"; restSeconds?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const day = await db.select().from(splitDays).where(and(eq(splitDays.id, input.splitDayId), eq(splitDays.userId, userId))).limit(1);
  if (!day[0]) throw new Error("Split day not found");
  const exercise = await getExerciseForUser(userId, input.exerciseId);
  if (!exercise) throw new Error("Exercise not found");
  const existing = await db.select({ id: splitDayExercises.id }).from(splitDayExercises).where(eq(splitDayExercises.splitDayId, input.splitDayId));
  const { targetRpe, targetRir, loadIncrement, ...rest } = input;
  const result = await db.insert(splitDayExercises).values({ ...rest, userId, orderIndex: existing.length, targetRpeTenth: targetRpe == null ? null : Math.round(targetRpe * 10), targetRirTenth: targetRir == null ? null : Math.round(targetRir * 10), loadIncrementTenth: loadIncrement == null ? 25 : Math.round(loadIncrement * 10) });
  return Number(result[0].insertId);
}

export async function deleteSplit(userId: number, splitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owned = await db.select({ id: splits.id }).from(splits).where(and(eq(splits.id, splitId), eq(splits.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Split not found");
  const days = await db.select({ id: splitDays.id }).from(splitDays).where(and(eq(splitDays.splitId, splitId), eq(splitDays.userId, userId)));
  for (const day of days) await db.delete(splitDayExercises).where(and(eq(splitDayExercises.splitDayId, day.id), eq(splitDayExercises.userId, userId)));
  await db.delete(splitDays).where(and(eq(splitDays.splitId, splitId), eq(splitDays.userId, userId)));
  await db.delete(splits).where(and(eq(splits.id, splitId), eq(splits.userId, userId)));
}

export async function createTrainingBlock(userId: number, input: { name: string; goal?: string; durationWeeks: number; startDate?: Date; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(trainingBlocks).values({ userId, name: input.name, goal: input.goal ?? "Progressive overload", durationWeeks: input.durationWeeks, startDate: input.startDate ?? null, notes: input.notes ?? null });
  const blockId = Number(result[0].insertId);
  await db.insert(trainingBlockWeeks).values(Array.from({ length: input.durationWeeks }, (_, index) => ({ userId, blockId, weekNumber: index + 1, label: index === input.durationWeeks - 1 ? "Peak" : index === 0 ? "Base" : "Build", intent: index === input.durationWeeks - 1 ? "Express strength" : "Build consistent volume", deload: 0, volumeMultiplierTenth: 10 })));
  return blockId;
}

export async function listTrainingBlocks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const blocks = await db.select().from(trainingBlocks).where(eq(trainingBlocks.userId, userId)).orderBy(desc(trainingBlocks.createdAt));
  const result = [];
  for (const block of blocks) {
    const weeks = await db.select().from(trainingBlockWeeks).where(and(eq(trainingBlockWeeks.blockId, block.id), eq(trainingBlockWeeks.userId, userId))).orderBy(trainingBlockWeeks.weekNumber);
    result.push({ ...block, weeks });
  }
  return result;
}

export async function startWorkout(userId: number, input: { splitDayId?: number; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  let day;
  if (input.splitDayId) {
    const rows = await db.select().from(splitDays).where(and(eq(splitDays.id, input.splitDayId), eq(splitDays.userId, userId))).limit(1);
    day = rows[0];
  }
  const name = input.name?.trim() || day?.name || "Open workout";
  const workoutResult = await db.insert(workouts).values({ userId, splitDayId: day?.id ?? null, name, status: "in_progress" });
  const workoutId = Number(workoutResult[0].insertId);
  if (day) {
    const prescriptions = await db.select().from(splitDayExercises).where(and(eq(splitDayExercises.splitDayId, day.id), eq(splitDayExercises.userId, userId))).orderBy(splitDayExercises.orderIndex);
    if (prescriptions.length) {
      await db.insert(workoutExercises).values(prescriptions.map((item, index) => ({ userId, workoutId, exerciseId: item.exerciseId, orderIndex: index, targetSets: item.targetSets, targetReps: item.targetReps, targetRpeTenth: item.targetRpeTenth, targetRirTenth: item.targetRirTenth, repMin: item.repMin, repMax: item.repMax, loadIncrementTenth: item.loadIncrementTenth, progressionStrategy: item.progressionStrategy, restSeconds: item.restSeconds })));
    }
  }
  return workoutId;
}

export async function getWorkout(userId: number, workoutId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const workoutRows = await db.select().from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId))).limit(1);
  const workout = workoutRows[0];
  if (!workout) return undefined;
  const exerciseRows = await db
    .select({ workoutExercise: workoutExercises, exercise: exercises })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(eq(workoutExercises.workoutId, workoutId), eq(workoutExercises.userId, userId)))
    .orderBy(workoutExercises.orderIndex);
  const items = [];
  for (const row of exerciseRows) {
    const sets = await db.select().from(workoutSets).where(and(eq(workoutSets.workoutExerciseId, row.workoutExercise.id), eq(workoutSets.userId, userId))).orderBy(workoutSets.setNumber);
    items.push({ ...row.workoutExercise, exercise: row.exercise, sets });
  }
  return { ...workout, exercises: items };
}

export async function addExerciseToWorkout(userId: number, input: { workoutId: number; exerciseId: number; targetSets: number; targetReps: string; targetRpe?: number; targetRir?: number; repMin?: number; repMax?: number; loadIncrement?: number; progressionStrategy?: "double_progression" | "rpe_autoregulation" | "fixed_load"; restSeconds?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const workout = await db.select({ id: workouts.id }).from(workouts).where(and(eq(workouts.id, input.workoutId), eq(workouts.userId, userId), eq(workouts.status, "in_progress"))).limit(1);
  if (!workout[0]) throw new Error("Workout not found");
  const exercise = await getExerciseForUser(userId, input.exerciseId);
  if (!exercise) throw new Error("Exercise not found");
  const existing = await db.select({ id: workoutExercises.id }).from(workoutExercises).where(eq(workoutExercises.workoutId, input.workoutId));
  const { targetRpe, targetRir, loadIncrement, ...rest } = input;
  const result = await db.insert(workoutExercises).values({ ...rest, userId, orderIndex: existing.length, targetRpeTenth: targetRpe == null ? null : Math.round(targetRpe * 10), targetRirTenth: targetRir == null ? null : Math.round(targetRir * 10), loadIncrementTenth: loadIncrement == null ? 25 : Math.round(loadIncrement * 10) });
  return Number(result[0].insertId);
}

export async function logSet(userId: number, input: { workoutId: number; workoutExerciseId: number; weight: number; reps: number; rpe?: number; rir?: number; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owned = await db.select({ id: workoutExercises.id }).from(workoutExercises).where(and(eq(workoutExercises.id, input.workoutExerciseId), eq(workoutExercises.workoutId, input.workoutId), eq(workoutExercises.userId, userId))).limit(1);
  if (!owned[0]) throw new Error("Workout exercise not found");
  const existing = await db.select({ setNumber: workoutSets.setNumber }).from(workoutSets).where(and(eq(workoutSets.workoutExerciseId, input.workoutExerciseId), eq(workoutSets.userId, userId))).orderBy(desc(workoutSets.setNumber)).limit(1);
  const setNumber = (existing[0]?.setNumber ?? 0) + 1;
  const result = await db.insert(workoutSets).values({ userId, workoutId: input.workoutId, workoutExerciseId: input.workoutExerciseId, setNumber, weightTenth: Math.round(input.weight * 10), reps: input.reps, rpeTenth: input.rpe == null ? null : Math.round(input.rpe * 10), rirTenth: input.rir == null ? null : Math.round(input.rir * 10), notes: input.notes ?? null, completed: 1 });
  return Number(result[0].insertId);
}

export async function completeWorkout(userId: number, workoutId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(workouts).set({ status: "completed", completedAt: new Date(), notes: notes ?? null }).where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}

export async function listHistory(userId: number, search?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const filter = search?.trim()
    ? and(eq(workouts.userId, userId), eq(workouts.status, "completed"), like(workouts.name, `%${search.trim()}%`))
    : and(eq(workouts.userId, userId), eq(workouts.status, "completed"));
  const rows = await db.select().from(workouts).where(filter).orderBy(desc(workouts.completedAt)).limit(limit);
  const result = [];
  for (const workout of rows) {
    const sets = await db.select().from(workoutSets).where(and(eq(workoutSets.workoutId, workout.id), eq(workoutSets.userId, userId)));
    result.push({ ...workout, totalSets: sets.length, totalVolume: sets.reduce((sum, set) => sum + (set.weightTenth * set.reps) / 10, 0) });
  }
  return result;
}

export async function getProgress(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ set: workoutSets, workout: workouts })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
    .where(and(eq(workoutSets.userId, userId), eq(workouts.userId, userId), eq(workouts.status, "completed"), eq(workoutExercises.exerciseId, exerciseId), eq(workoutSets.completed, 1)))
    .orderBy(workouts.completedAt);
  const byDate = new Map<string, { date: string; weight: number; volume: number; reps: number }>();
  for (const row of rows) {
    const date = (row.workout.completedAt ?? row.workout.startedAt).toISOString().slice(0, 10);
    const current = byDate.get(date) ?? { date, weight: 0, volume: 0, reps: 0 };
    current.weight = Math.max(current.weight, row.set.weightTenth / 10);
    current.volume += (row.set.weightTenth * row.set.reps) / 10;
    current.reps += row.set.reps;
    byDate.set(date, current);
  }
  return [...byDate.values()];
}

export async function getRecommendations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ set: workoutSets, workout: workouts, exercise: exercises, workoutExercise: workoutExercises })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(eq(workoutSets.userId, userId), eq(workouts.userId, userId), eq(workouts.status, "completed"), eq(workoutSets.completed, 1)))
    .orderBy(desc(workouts.completedAt), desc(workoutSets.createdAt));
  const grouped = new Map<number, { exerciseName: string; prescription: typeof rows[number]["workoutExercise"]; sessions: Map<number, HistoricalSet[]> }>();
  for (const row of rows) {
    const current = grouped.get(row.exercise.id) ?? { exerciseName: row.exercise.name, prescription: row.workoutExercise, sessions: new Map<number, HistoricalSet[]>() };
    const sets = current.sessions.get(row.workout.id) ?? [];
    sets.push({ weight: row.set.weightTenth / 10, reps: row.set.reps, rpe: row.set.rpeTenth == null ? null : row.set.rpeTenth / 10, rir: row.set.rirTenth == null ? null : row.set.rirTenth / 10 });
    current.sessions.set(row.workout.id, sets);
    grouped.set(row.exercise.id, current);
  }
  return [...grouped.values()].slice(0, 3).map(item => progressionPlanFor({ exerciseName: item.exerciseName, prescription: item.prescription, sessions: [...item.sessions.values()] }));
}

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return { heatmap: [], recovery: [], milestones: [], days: [] };

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 27);
  const rows = await db
    .select({ set: workoutSets, workout: workouts, exercise: exercises })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(eq(workoutSets.userId, userId), eq(workouts.userId, userId), eq(workouts.status, "completed"), eq(workoutSets.completed, 1)))
    .orderBy(desc(workouts.completedAt), desc(workoutSets.createdAt));

  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const dayMuscle = new Map<string, { sets: number; volume: number }>();
  const muscleSessions = new Map<string, { sets: number; lastTrained: Date | null; recentSets: number }>();
  const exerciseStats = new Map<number, { exerciseName: string; muscle: string; bestWeight: number; bestReps: number; bestEstimatedOneRepMax: number; achievedAt: Date | null }>();
  const recent72h = now.getTime() - 72 * 60 * 60 * 1000;

  for (const row of rows) {
    const sessionDate = row.workout.completedAt ?? row.workout.startedAt;
    const dateKey = sessionDate.toISOString().slice(0, 10);
    const muscle = normalizeMuscleGroup(row.exercise.muscleGroup);
    if (sessionDate >= start) {
      const key = `${muscle}:${dateKey}`;
      const bucket = dayMuscle.get(key) ?? { sets: 0, volume: 0 };
      bucket.sets += 1;
      bucket.volume += (row.set.weightTenth * row.set.reps) / 10;
      dayMuscle.set(key, bucket);
    }
    const recovery = muscleSessions.get(muscle) ?? { sets: 0, lastTrained: null, recentSets: 0 };
    recovery.sets += 1;
    if (!recovery.lastTrained || sessionDate > recovery.lastTrained) recovery.lastTrained = sessionDate;
    if (sessionDate.getTime() >= recent72h) recovery.recentSets += 1;
    muscleSessions.set(muscle, recovery);

    const weight = row.set.weightTenth / 10;
    const estimatedOneRepMax = weight * (1 + row.set.reps / 30);
    const current = exerciseStats.get(row.exercise.id);
    if (!current || estimatedOneRepMax > current.bestEstimatedOneRepMax) {
      exerciseStats.set(row.exercise.id, { exerciseName: row.exercise.name, muscle, bestWeight: weight, bestReps: row.set.reps, bestEstimatedOneRepMax: Math.round(estimatedOneRepMax * 10) / 10, achievedAt: sessionDate });
    }
  }

  const heatmap = MUSCLE_GROUPS.flatMap(muscle => days.map(date => {
    const bucket = dayMuscle.get(`${muscle}:${date}`) ?? { sets: 0, volume: 0 };
    return { muscle, date, sets: bucket.sets, volume: Math.round(bucket.volume), intensity: bucket.sets === 0 ? 0 : bucket.sets <= 2 ? 1 : bucket.sets <= 4 ? 2 : bucket.sets <= 6 ? 3 : 4 };
  }));
  const recovery = MUSCLE_GROUPS.map(muscle => {
    const current = muscleSessions.get(muscle) ?? { sets: 0, lastTrained: null, recentSets: 0 };
    const hoursSinceLastSession = current.lastTrained ? (now.getTime() - current.lastTrained.getTime()) / (60 * 60 * 1000) : null;
    return { muscle, weeklySets: current.sets, lastTrained: current.lastTrained?.toISOString() ?? null, ...recoveryState(current.recentSets, hoursSinceLastSession) };
  });
  const milestones = [...exerciseStats.values()]
    .sort((a, b) => b.bestEstimatedOneRepMax - a.bestEstimatedOneRepMax)
    .slice(0, 8)
    .map(item => ({ ...item, ...milestoneProgress(item.bestWeight), achievedAt: item.achievedAt?.toISOString() ?? null }));

  return { heatmap, recovery, milestones, days };
}
