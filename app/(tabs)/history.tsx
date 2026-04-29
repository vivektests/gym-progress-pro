import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { workoutStorage } from '@/lib/storage';
import type { WorkoutSession } from '@/lib/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const allWorkouts = await workoutStorage.getAll();
      setWorkouts(allWorkouts.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await workoutStorage.delete(id);
            await loadWorkouts();
            Alert.alert('Success', 'Workout deleted');
          } catch (error) {
            console.error('Error deleting workout:', error);
            Alert.alert('Error', 'Failed to delete workout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getMonthKey = (date: number): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const groupedWorkouts = workouts.reduce(
    (acc, workout) => {
      const month = getMonthKey(workout.date);
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(workout);
      return acc;
    },
    {} as Record<string, WorkoutSession[]>
  );

  const months = Object.keys(groupedWorkouts).sort().reverse();

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Workout History</Text>
            <Text className="text-base text-muted">Review your past workouts</Text>
          </View>

          {/* Workouts List */}
          {workouts.length === 0 ? (
            <View className="bg-surface border border-border rounded-xl p-6 items-center gap-3">
              <Text className="text-base text-muted text-center">No workouts logged yet</Text>
              <Text className="text-xs text-muted text-center">
                Start by logging your first workout to see your history here
              </Text>
            </View>
          ) : (
            <View className="gap-6">
              {months.map((month) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <View key={month} className="gap-3">
                    <Text className="text-lg font-semibold text-foreground">{monthName}</Text>

                    {groupedWorkouts[month].map((workout) => {
                      const date = new Date(workout.date);
                      const dateStr = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });
                      const timeStr = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <View key={workout.id} className="bg-surface border border-border rounded-xl p-4 gap-3">
                          {/* Header */}
                          <View className="flex-row justify-between items-start">
                            <View className="flex-1 gap-1">
                              <Text className="text-sm font-semibold text-foreground">{dateStr}</Text>
                              <Text className="text-xs text-muted">{timeStr}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleDeleteWorkout(workout.id)}
                              className="px-3 py-1 rounded-lg active:opacity-80"
                            >
                              <Text className="text-xs text-error font-medium">Delete</Text>
                            </TouchableOpacity>
                          </View>

                          {/* Exercises */}
                          <View className="gap-2">
                            {workout.exercises.map((exercise, idx) => (
                              <View
                                key={exercise.id}
                                className={`bg-background/50 rounded-lg p-2 ${
                                  idx !== workout.exercises.length - 1 ? 'border-b border-border' : ''
                                }`}
                              >
                                <View className="flex-row justify-between items-start mb-1">
                                  <Text className="text-sm font-semibold text-foreground flex-1">
                                    {exercise.exerciseName}
                                  </Text>
                                  <Text className="text-xs text-muted">{exercise.weight}kg</Text>
                                </View>
                                <Text className="text-xs text-muted">
                                  {exercise.reps} reps × {exercise.sets} sets
                                  {exercise.rpe ? ` (RPE ${exercise.rpe})` : ''}
                                </Text>
                                <Text className="text-xs text-foreground font-medium mt-1">
                                  Volume: {(exercise.weight * exercise.reps * exercise.sets).toLocaleString()} kg
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Summary */}
                          <View className="bg-primary/10 rounded-lg p-2">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-xs text-muted">Total Volume</Text>
                              <Text className="text-sm font-bold text-primary">
                                {Math.round(workout.totalVolume).toLocaleString()} kg
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
