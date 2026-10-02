/**
 * AsyncStorage persistence layer for Gym Progress Pro
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ExerciseLog,
  WorkoutSession,
  UserProfile,
  WorkoutSplit,
  Exercise,
} from './types';

const STORAGE_KEYS = {
  USER_PROFILE: 'gym_progress_user_profile',
  WORKOUTS: 'gym_progress_workouts',
  EXERCISES: 'gym_progress_exercises',
  SPLITS: 'gym_progress_splits',
  SELECTED_SPLIT: 'gym_progress_selected_split',
};

export const userProfileStorage = {
  async get(): Promise<UserProfile | null> {
    try { const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE); return data ? JSON.parse(data) : null; }
    catch (error) { console.error('Error reading user profile:', error); return null; }
  },
  async set(profile: UserProfile): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile)); }
    catch (error) { console.error('Error saving user profile:', error); }
  },
  async clear(): Promise<void> {
    try { await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE); }
    catch (error) { console.error('Error clearing user profile:', error); }
  },
};

export const workoutStorage = {
  async getAll(): Promise<WorkoutSession[]> {
    try { const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS); return data ? JSON.parse(data) : []; }
    catch (error) { console.error('Error reading workouts:', error); return []; }
  },
  async add(workout: WorkoutSession): Promise<void> {
    try { const workouts = await this.getAll(); workouts.push(workout); await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts)); }
    catch (error) { console.error('Error adding workout:', error); }
  },
  async update(id: string, workout: Partial<WorkoutSession>): Promise<void> {
    try { const workouts = await this.getAll(); const index = workouts.findIndex((w) => w.id === id); if (index !== -1) { workouts[index] = { ...workouts[index], ...workout }; await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts)); } }
    catch (error) { console.error('Error updating workout:', error); }
  },
  async delete(id: string): Promise<void> {
    try { const workouts = await this.getAll(); await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts.filter((w) => w.id !== id))); }
    catch (error) { console.error('Error deleting workout:', error); }
  },
  async getByDate(startDate: number, endDate: number): Promise<WorkoutSession[]> {
    try { const workouts = await this.getAll(); return workouts.filter((w) => w.date >= startDate && w.date <= endDate); }
    catch (error) { console.error('Error filtering workouts by date:', error); return []; }
  },
  async getLatest(limit: number = 5): Promise<WorkoutSession[]> {
    try { const workouts = await this.getAll(); return workouts.sort((a, b) => b.date - a.date).slice(0, limit); }
    catch (error) { console.error('Error getting latest workouts:', error); return []; }
  },
  async clear(): Promise<void> {
    try { await AsyncStorage.removeItem(STORAGE_KEYS.WORKOUTS); }
    catch (error) { console.error('Error clearing workouts:', error); }
  },
};

export const exerciseStorage = {
  async getAll(): Promise<Exercise[]> {
    try { const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES); return data ? JSON.parse(data) : []; }
    catch (error) { console.error('Error reading exercises:', error); return []; }
  },
  async add(exercise: Exercise): Promise<void> {
    try { const exercises = await this.getAll(); exercises.push(exercise); await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises)); }
    catch (error) { console.error('Error adding exercise:', error); }
  },
  async delete(id: string): Promise<void> {
    try { const exercises = await this.getAll(); await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises.filter((exercise) => exercise.id !== id))); }
    catch (error) { console.error('Error deleting exercise:', error); }
  },
  async clear(): Promise<void> {
    try { await AsyncStorage.removeItem(STORAGE_KEYS.EXERCISES); }
    catch (error) { console.error('Error clearing exercises:', error); }
  },
};

export const splitStorage = {
  async getAll(): Promise<WorkoutSplit[]> {
    try { const data = await AsyncStorage.getItem(STORAGE_KEYS.SPLITS); return data ? JSON.parse(data) : []; }
    catch (error) { console.error('Error reading splits:', error); return []; }
  },
  async add(split: WorkoutSplit): Promise<void> {
    try { const splits = await this.getAll(); splits.push(split); await AsyncStorage.setItem(STORAGE_KEYS.SPLITS, JSON.stringify(splits)); }
    catch (error) { console.error('Error adding split:', error); }
  },
  async getSelected(): Promise<WorkoutSplit | null> {
    try { const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SPLIT); return data ? JSON.parse(data) : null; }
    catch (error) { console.error('Error reading selected split:', error); return null; }
  },
  async setSelected(split: WorkoutSplit): Promise<void> {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SPLIT, JSON.stringify(split)); }
    catch (error) { console.error('Error saving selected split:', error); }
  },
  async clear(): Promise<void> {
    try { await AsyncStorage.removeItem(STORAGE_KEYS.SPLITS); await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_SPLIT); }
    catch (error) { console.error('Error clearing splits:', error); }
  },
};
