import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '@/components/screen-container';
import { EXERCISE_DATABASE } from '@/lib/workout-data';
import { exerciseStorage, workoutStorage, splitStorage } from '@/lib/storage';
import { calculateRPEProgression } from '@/lib/progression';
import type { Exercise, ExerciseLog, WorkoutSession } from '@/lib/types';

export default function LoggerScreen() {
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>(EXERCISE_DATABASE);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<ExerciseLog[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const loadCurrentWorkout = useCallback(async () => {
    try {
      const [workouts, customExercises] = await Promise.all([workoutStorage.getAll(), exerciseStorage.getAll()]);
      setAvailableExercises([...EXERCISE_DATABASE, ...customExercises]);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayWorkout = workouts.find((workout) => { const date = new Date(workout.date); date.setHours(0, 0, 0, 0); return date.getTime() === today.getTime(); });
      setCurrentWorkout(todayWorkout?.exercises ?? []);
    } catch (error) { console.error('Error loading logger data:', error); }
  }, []);

  useFocusEffect(useCallback(() => { loadCurrentWorkout(); }, [loadCurrentWorkout]));

  const handleAddExercise = async () => {
    if (!selectedExercise || !weight || !reps || !sets) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    setLoading(true);
    try {
      const exercise = availableExercises.find((item) => item.id === selectedExercise);
      if (!exercise) { Alert.alert('Error', 'Exercise not found'); return; }
      const parsedWeight = parseFloat(weight); const parsedReps = parseInt(reps, 10); const parsedSets = parseInt(sets, 10);
      if ([parsedWeight, parsedReps, parsedSets].some((value) => !Number.isFinite(value) || value <= 0)) { Alert.alert('Error', 'Enter positive numbers for weight, reps, and sets.'); return; }
      const newLog: ExerciseLog = { id: `log_${Date.now()}`, exerciseId: selectedExercise, exerciseName: exercise.name, weight: parsedWeight, reps: parsedReps, sets: parsedSets, rpe: rpe ? parseInt(rpe, 10) : undefined, notes: notes || undefined, timestamp: Date.now() };
      const rec = calculateRPEProgression(parsedWeight, parsedReps, parsedSets, rpe ? parseInt(rpe, 10) : undefined, exercise.category === 'isolation' ? 'isolation' : 'compound');
      setRecommendation(rec.rationale);
      const updated = [...currentWorkout, newLog]; setCurrentWorkout(updated);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const workouts = await workoutStorage.getAll();
      const todayWorkout = workouts.find((workout) => { const date = new Date(workout.date); date.setHours(0, 0, 0, 0); return date.getTime() === today.getTime(); });
      const totalVolume = updated.reduce((sum, log) => sum + log.weight * log.reps * log.sets, 0);
      if (todayWorkout) await workoutStorage.update(todayWorkout.id, { exercises: updated, totalVolume });
      else { const split = await splitStorage.getSelected(); const newSession: WorkoutSession = { id: `workout_${Date.now()}`, date: Date.now(), splitDay: split?.days[0]?.name, exercises: updated, totalVolume }; await workoutStorage.add(newSession); }
      setSelectedExercise(null); setWeight(''); setReps(''); setSets(''); setRpe(''); setNotes(''); setShowExerciseList(false);
      Alert.alert('Success', 'Exercise logged!');
    } catch (error) { console.error('Error adding exercise:', error); Alert.alert('Error', 'Failed to log exercise'); }
    finally { setLoading(false); }
  };

  const selectedExerciseName = availableExercises.find((exercise) => exercise.id === selectedExercise)?.name;
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          <View className="gap-2"><Text className="text-3xl font-bold text-foreground">Log Workout</Text><Text className="text-base text-muted">Record your exercise performance</Text></View>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Exercise</Text>
            <TouchableOpacity onPress={() => setShowExerciseList(!showExerciseList)} className="bg-surface border border-border rounded-lg p-4 active:opacity-80"><Text className={selectedExercise ? 'text-foreground font-medium' : 'text-muted'}>{selectedExerciseName || 'Select an exercise...'}</Text></TouchableOpacity>
            {showExerciseList && <View className="bg-surface border border-border rounded-lg max-h-72"><ScrollView nestedScrollEnabled>{availableExercises.map((exercise) => <TouchableOpacity key={exercise.id} onPress={() => { setSelectedExercise(exercise.id); setShowExerciseList(false); }} className="p-3 border-b border-border active:bg-primary/10"><Text className="text-foreground font-medium">{exercise.name}</Text><Text className="text-xs text-muted mt-1">{exercise.category}{exercise.id.startsWith('custom_') ? ' · Custom' : ''}</Text></TouchableOpacity>)}</ScrollView></View>}
          </View>
          <View className="gap-4">
            {([['Weight (kg)', weight, setWeight, 'e.g., 100', 'decimal-pad'], ['Reps', reps, setReps, 'e.g., 8', 'number-pad'], ['Sets', sets, setSets, 'e.g., 3', 'number-pad'], ['RPE (1-10)', rpe, setRpe, 'e.g., 7', 'number-pad']] as const).map(([label, value, setter, placeholder, keyboardType]) => <View key={label} className="gap-2"><Text className="text-sm font-semibold text-foreground">{label}</Text><TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor="#687076" keyboardType={keyboardType} className="bg-surface border border-border rounded-lg p-3 text-foreground" />{label.startsWith('RPE') && <Text className="text-xs text-muted">Rate of Perceived Exertion (optional)</Text>}</View>)}
            <View className="gap-2"><Text className="text-sm font-semibold text-foreground">Notes (Optional)</Text><TextInput value={notes} onChangeText={setNotes} placeholder="Add notes..." placeholderTextColor="#687076" multiline numberOfLines={3} className="bg-surface border border-border rounded-lg p-3 text-foreground" /></View>
          </View>
          {recommendation && <View className="bg-success/10 border border-success rounded-lg p-3 gap-1"><Text className="text-xs font-semibold text-success">Progression Tip</Text><Text className="text-xs text-muted">{recommendation}</Text></View>}
          <TouchableOpacity onPress={handleAddExercise} disabled={loading} className={`rounded-lg p-4 ${loading ? 'opacity-50' : 'active:opacity-80'} ${selectedExercise && weight && reps && sets ? 'bg-primary' : 'bg-muted'}`}>{loading ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-bold text-center">Add to Workout</Text>}</TouchableOpacity>
          {currentWorkout.length > 0 && <View className="gap-3"><Text className="text-lg font-semibold text-foreground">Today's Workout ({currentWorkout.length})</Text>{currentWorkout.map((log) => <View key={log.id} className="bg-surface border border-border rounded-lg p-3"><View className="flex-row justify-between items-start mb-2"><Text className="font-semibold text-foreground flex-1">{log.exerciseName}</Text><Text className="text-xs text-muted">{log.weight}kg</Text></View><Text className="text-sm text-muted">{log.reps} reps × {log.sets} sets {log.rpe ? `(RPE ${log.rpe})` : ''}</Text><Text className="text-xs text-foreground font-medium mt-1">Volume: {(log.weight * log.reps * log.sets).toLocaleString()} kg</Text></View>)}</View>}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
