import { z } from "zod";
import { getAnalytics, getDb, getExerciseForUser, getProgress, getRecommendations, getSplits, getWorkout, listExercises, listHistory, addExerciseToSplitDay, addExerciseToWorkout, completeWorkout, createExercise, createSplit, logSet, startWorkout, deleteSplit } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { desc, eq, and } from "drizzle-orm";
import { workouts } from "../drizzle/schema";

const idInput = z.object({ id: z.number().int().positive() });

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ status: "ok" as const })),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("webdev_app_session", { httpOnly: true, path: "/", sameSite: "none", secure: true, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [splitRows, history, recommendations, exerciseRows] = await Promise.all([
        getSplits(ctx.user.id),
        listHistory(ctx.user.id),
        getRecommendations(ctx.user.id),
        listExercises(ctx.user.id),
      ]);
      const currentWeek = new Date();
      currentWeek.setDate(currentWeek.getDate() - 7);
      const sessionsThisWeek = history.filter(item => item.completedAt && item.completedAt >= currentWeek).length;
      const totalVolume = history.reduce((sum, item) => sum + item.totalVolume, 0);
      return {
        user: ctx.user,
        splits: splitRows,
        history: history.slice(0, 5),
        recommendations,
        exercises: exerciseRows,
        stats: { sessionsThisWeek, totalSessions: history.length, totalVolume, splitCount: splitRows.length },
      };
    }),
  }),
  exercises: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ ctx, input }) => listExercises(ctx.user.id, input?.search)),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), muscleGroup: z.string().min(2).max(80), equipment: z.string().min(2).max(80) })).mutation(({ ctx, input }) => createExercise(ctx.user.id, input)),
    get: protectedProcedure.input(idInput).query(({ ctx, input }) => getExerciseForUser(ctx.user.id, input.id)),
  }),
  splits: router({
    list: protectedProcedure.query(({ ctx }) => getSplits(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), description: z.string().max(500).optional(), days: z.array(z.object({ name: z.string().min(2).max(120), focus: z.string().min(2).max(120) })).min(1).max(7) })).mutation(({ ctx, input }) => createSplit(ctx.user.id, input)),
    addExercise: protectedProcedure.input(z.object({ splitDayId: z.number().int().positive(), exerciseId: z.number().int().positive(), targetSets: z.number().int().min(1).max(10), targetReps: z.string().min(1).max(30) })).mutation(({ ctx, input }) => addExerciseToSplitDay(ctx.user.id, input)),
    delete: protectedProcedure.input(idInput).mutation(({ ctx, input }) => deleteSplit(ctx.user.id, input.id)),
  }),
  workouts: router({
    active: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select({ id: workouts.id }).from(workouts).where(and(eq(workouts.userId, ctx.user.id), eq(workouts.status, "in_progress"))).orderBy(desc(workouts.startedAt)).limit(1);
      return rows[0] ? getWorkout(ctx.user.id, rows[0].id) : null;
    }),
    history: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ ctx, input }) => listHistory(ctx.user.id, input?.search)),
    export: protectedProcedure.query(({ ctx }) => listHistory(ctx.user.id, undefined, 5000)),
    get: protectedProcedure.input(idInput).query(({ ctx, input }) => getWorkout(ctx.user.id, input.id)),
    start: protectedProcedure.input(z.object({ splitDayId: z.number().int().positive().optional(), name: z.string().max(160).optional() })).mutation(({ ctx, input }) => startWorkout(ctx.user.id, input)),
    addExercise: protectedProcedure.input(z.object({ workoutId: z.number().int().positive(), exerciseId: z.number().int().positive(), targetSets: z.number().int().min(1).max(10), targetReps: z.string().min(1).max(30) })).mutation(({ ctx, input }) => addExerciseToWorkout(ctx.user.id, input)),
    logSet: protectedProcedure.input(z.object({ workoutId: z.number().int().positive(), workoutExerciseId: z.number().int().positive(), weight: z.number().min(0).max(1000), reps: z.number().int().min(0).max(100), rpe: z.number().min(0).max(10).optional(), notes: z.string().max(500).optional() })).mutation(({ ctx, input }) => logSet(ctx.user.id, input)),
    complete: protectedProcedure.input(z.object({ workoutId: z.number().int().positive(), notes: z.string().max(500).optional() })).mutation(({ ctx, input }) => completeWorkout(ctx.user.id, input.workoutId, input.notes)),
  }),
  progress: router({
    series: protectedProcedure.input(z.object({ exerciseId: z.number().int().positive() })).query(({ ctx, input }) => getProgress(ctx.user.id, input.exerciseId)),
  }),
  recommendations: router({
    list: protectedProcedure.query(({ ctx }) => getRecommendations(ctx.user.id)),
  }),
  analytics: router({
    summary: protectedProcedure.query(({ ctx }) => getAnalytics(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
