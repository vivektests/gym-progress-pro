import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { EXERCISE_DATABASE } from '@/lib/workout-data';
import { workoutStorage, splitStorage } from '@/lib/storage';
import { calculateRPEProgression } from '@/lib/progression';
import type { ExerciseLog, WorkoutSession } from '@/lib/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function LoggerScreen() {
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

  useFocusEffect(
    useCallback(() => {
      loadCurrentWorkout();
    }, [])
  );

  const loadCurrentWorkout = async () => {
    try {
      const workouts = await workoutStorage.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayWorkout = workouts.find((w) => {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === today.getTime();
      });

      if (todayWorkout) {
        setCurrentWorkout(todayWorkout.exercises);
      } else {
        setCurrentWorkout([]);
      }
    } catch (error) {
      console.error('Error loading current workout:', error);
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExercise || !weight || !reps || !sets) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const exercise = EXERCISE_DATABASE.find((e) => e.id === selectedExercise);
      if (!exercise) {
        Alert.alert('Error', 'Exercise not found');
        return;
      }

      const newLog: ExerciseLog = {
        id: `log_${Date.now()}`,
        exerciseId: selectedExercise,
        exerciseName: exercise.name,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        sets: parseInt(sets),
        rpe: rpe ? parseInt(rpe) : undefined,
        notes: notes || undefined,
        timestamp: Date.now(),
      };

      // Get progression recommendation
      const rec = calculateRPEProgression(
        parseFloat(weight),
        parseInt(reps),
        parseInt(sets),
        rpe ? parseInt(rpe) : undefined,
        (exercise.category === 'compound' || exercise.category === 'isolation') ? exercise.category : 'compound'
      );
      setRecommendation(rec.rationale);

      // Add to current workout
      const updated = [...currentWorkout, newLog];
      setCurrentWorkout(updated);

      // Save workout session
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const workouts = await workoutStorage.getAll();
      const todayWorkout = workouts.find((w) => {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === today.getTime();
      });

      if (todayWorkout) {
        todayWorkout.exercises = updated;
        todayWorkout.totalVolume = updated.reduce((sum, log) => sum + log.weight * log.reps * log.sets, 0);
        await workoutStorage.update(todayWorkout.id, todayWorkout);
      } else {
        const split = await splitStorage.getSelected();
        const newSession: WorkoutSession = {
          id: `workout_${Date.now()}`,
          date: Date.now(),
          splitDay: split?.days[0]?.name,
          exercises: updated,
          totalVolume: updated.reduce((sum, log) => sum + log.weight * log.reps * log.sets, 0),
        };
        await workoutStorage.add(newSession);
      }

      // Reset form
      setSelectedExercise(null);
      setWeight('');
      setReps('');
      setSets('');
      setRpe('');
      setNotes('');
      setShowExerciseList(false);

      Alert.alert('Success', 'Exercise logged!');
    } catch (error) {
      console.error('Error adding exercise:', error);
      Alert.alert('Error', 'Failed to log exercise');
    } finally {
      setLoading(false);
    }
  };

  const selectedExerciseName = EXERCISE_DATABASE.find((e) => e.id === selectedExercise)?.name;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Log Workout</Text>
            <Text className="text-base text-muted">Record your exercise performance</Text>
          </View>

          {/* Exercise Selection */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Exercise</Text>
            <TouchableOpacity
              onPress={() => setShowExerciseList(!showExerciseList)}
              className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
            >
              <Text className={selectedExercise ? 'text-foreground font-medium' : 'text-muted'}>
                {selectedExerciseName || 'Select an exercise...'}
              </Text>
            </TouchableOpacity>

            {showExerciseList && (
              <View className="bg-surface border border-border rounded-lg max-h-64">
                <ScrollView nestedScrollEnabled={true}>
                  {EXERCISE_DATABASE.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => {
                        setSelectedExercise(exercise.id);
                        setShowExerciseList(false);
                      }}
                      className="p-3 border-b border-border active:bg-primary/10"
                    >
                      <Text className="text-foreground font-medium">{exercise.name}</Text>
                      <Text className="text-xs text-muted mt-1">{exercise.category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Input Fields */}
          <View className="gap-4">
            {/* Weight */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g., 100"
                placeholderTextColor="#687076"
                keyboardType="decimal-pad"
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Reps */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Reps</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                placeholder="e.g., 8"
                placeholderTextColor="#687076"
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Sets */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Sets</Text>
              <TextInput
                value={sets}
                onChangeText={setSets}
                placeholder="e.g., 3"
                placeholderTextColor="#687076"
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* RPE */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">RPE (1-10)</Text>
              <TextInput
                value={rpe}
                onChangeText={setRpe}
                placeholder="e.g., 7"
                placeholderTextColor="#687076"
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
              <Text className="text-xs text-muted">Rate of Perceived Exertion (optional)</Text>
            </View>

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor="#687076"
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
            </View>
          </View>

          {/* Recommendation */}
          {recommendation && (
            <View className="bg-success/10 border border-success rounded-lg p-3 gap-1">
              <Text className="text-xs font-semibold text-success">Progression Tip</Text>
              <Text className="text-xs text-muted">{recommendation}</Text>
            </View>
          )}

          {/* Add Button */}
          <TouchableOpacity
            onPress={handleAddExercise}
            disabled={loading}
            className={`rounded-lg p-4 ${loading ? 'opacity-50' : 'active:opacity-80'} ${
              selectedExercise && weight && reps && sets ? 'bg-primary' : 'bg-muted'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-bold text-center">Add to Workout</Text>
            )}
          </TouchableOpacity>

          {/* Current Workout */}
          {currentWorkout.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Today's Workout ({currentWorkout.length})</Text>
              {currentWorkout.map((log) => (
                <View key={log.id} className="bg-surface border border-border rounded-lg p-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-semibold text-foreground flex-1">{log.exerciseName}</Text>
                    <Text className="text-xs text-muted">{log.weight}kg</Text>
                  </View>
                  <Text className="text-sm text-muted">
                    {log.reps} reps × {log.sets} sets {log.rpe ? `(RPE ${log.rpe})` : ''}
                  </Text>
                  <Text className="text-xs text-foreground font-medium mt-1">
                    Volume: {(log.weight * log.reps * log.sets).toLocaleString()} kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
