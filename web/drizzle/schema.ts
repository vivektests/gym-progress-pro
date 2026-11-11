import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 120 }).notNull(),
  muscleGroup: varchar("muscleGroup", { length: 80 }).notNull(),
  equipment: varchar("equipment", { length: 80 }).notNull(),
  isStandard: int("isStandard").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const splits = mysqlTable("splits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const splitDays = mysqlTable("splitDays", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  splitId: int("splitId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  focus: varchar("focus", { length: 120 }).notNull(),
  dayOrder: int("dayOrder").default(0).notNull(),
});

export const splitDayExercises = mysqlTable("splitDayExercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  splitDayId: int("splitDayId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  targetSets: int("targetSets").default(3).notNull(),
  targetReps: varchar("targetReps", { length: 30 }).default("8-12").notNull(),
  targetRpeTenth: int("targetRpeTenth"),
  targetRirTenth: int("targetRirTenth"),
  repMin: int("repMin").default(8).notNull(),
  repMax: int("repMax").default(12).notNull(),
  loadIncrementTenth: int("loadIncrementTenth").default(25).notNull(),
  progressionStrategy: mysqlEnum("progressionStrategy", ["double_progression", "rpe_autoregulation", "fixed_load"]).default("double_progression").notNull(),
  restSeconds: int("restSeconds").default(90).notNull(),
  notes: text("notes"),
});

export const workouts = mysqlTable("workouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  splitDayId: int("splitDayId"),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
});

export const workoutExercises = mysqlTable("workoutExercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workoutId: int("workoutId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  targetSets: int("targetSets").default(3).notNull(),
  targetReps: varchar("targetReps", { length: 30 }).default("8-12").notNull(),
  targetRpeTenth: int("targetRpeTenth"),
  targetRirTenth: int("targetRirTenth"),
  repMin: int("repMin").default(8).notNull(),
  repMax: int("repMax").default(12).notNull(),
  loadIncrementTenth: int("loadIncrementTenth").default(25).notNull(),
  progressionStrategy: mysqlEnum("progressionStrategy", ["double_progression", "rpe_autoregulation", "fixed_load"]).default("double_progression").notNull(),
  restSeconds: int("restSeconds").default(90).notNull(),
});

export const workoutSets = mysqlTable("workoutSets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workoutId: int("workoutId").notNull(),
  workoutExerciseId: int("workoutExerciseId").notNull(),
  setNumber: int("setNumber").notNull(),
  weightTenth: int("weightTenth").default(0).notNull(),
  reps: int("reps").default(0).notNull(),
  rpeTenth: int("rpeTenth"),
  rirTenth: int("rirTenth"),
  notes: text("notes"),
  completed: int("completed").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trainingBlocks = mysqlTable("trainingBlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  goal: varchar("goal", { length: 120 }).default("Progressive overload").notNull(),
  durationWeeks: int("durationWeeks").default(4).notNull(),
  startDate: timestamp("startDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trainingBlockWeeks = mysqlTable("trainingBlockWeeks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  blockId: int("blockId").notNull(),
  weekNumber: int("weekNumber").notNull(),
  label: varchar("label", { length: 120 }).default("Build").notNull(),
  intent: text("intent"),
  deload: int("deload").default(0).notNull(),
  volumeMultiplierTenth: int("volumeMultiplierTenth").default(10).notNull(),
  splitId: int("splitId"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type Split = typeof splits.$inferSelect;
export type SplitDay = typeof splitDays.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type TrainingBlock = typeof trainingBlocks.$inferSelect;
export type TrainingBlockWeek = typeof trainingBlockWeeks.$inferSelect;
