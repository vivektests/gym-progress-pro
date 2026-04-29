import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { workoutStorage } from '@/lib/storage';
import { calculateWeeklyProgress, getWeekStart, getWeeklyVolumeTrend } from '@/lib/analytics';
import type { WorkoutSession } from '@/lib/types';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalVolume: 0,
    workoutCount: 0,
    avgWeight: 0,
  });
  const [volumeTrend, setVolumeTrend] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allWorkouts = await workoutStorage.getAll();
      setWorkouts(allWorkouts);

      // Calculate this week's stats
      const weekStart = getWeekStart(new Date()).getTime();
      const weekProgress = calculateWeeklyProgress(allWorkouts, weekStart);
      setWeeklyStats({
        totalVolume: Math.round(weekProgress.totalVolume),
        workoutCount: weekProgress.workoutCount,
        avgWeight: weekProgress.workoutCount > 0 ? Math.round(weekProgress.totalVolume / weekProgress.workoutCount / 100) : 0,
      });

      // Get volume trend for chart
      const trend = getWeeklyVolumeTrend(allWorkouts, 12);
      setVolumeTrend(trend);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <Text className="text-3xl font-bold text-foreground">Gym Progress Pro</Text>
            <Text className="text-base text-muted">Track your strength journey</Text>
          </View>

          {/* Weekly Stats Cards */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">This Week</Text>
            <View className="flex-row gap-3">
              {/* Total Volume Card */}
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm text-muted mb-1">Total Volume</Text>
                <Text className="text-2xl font-bold text-primary">{weeklyStats.totalVolume.toLocaleString()}</Text>
                <Text className="text-xs text-muted mt-1">kg</Text>
              </View>

              {/* Workouts Card */}
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm text-muted mb-1">Workouts</Text>
                <Text className="text-2xl font-bold text-success">{weeklyStats.workoutCount}</Text>
                <Text className="text-xs text-muted mt-1">sessions</Text>
              </View>

              {/* Avg Weight Card */}
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm text-muted mb-1">Avg Weight</Text>
                <Text className="text-2xl font-bold text-foreground">{weeklyStats.avgWeight}</Text>
                <Text className="text-xs text-muted mt-1">kg</Text>
              </View>
            </View>
          </View>

          {/* Recent Workouts */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">Recent Workouts</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text className="text-sm text-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            {workouts.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 items-center gap-3 border border-border">
                <Text className="text-base text-muted text-center">No workouts yet</Text>
                <TouchableOpacity
                  onPress={() => router.push('/logger')}
                  className="bg-primary px-6 py-2 rounded-full active:opacity-80"
                >
                  <Text className="text-background font-semibold text-sm">Log First Workout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              workouts
                .slice(-3)
                .reverse()
                .map((workout) => (
                  <View key={workout.id} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-sm font-semibold text-foreground">
                        {new Date(workout.date).toLocaleDateString()}
                      </Text>
                      <Text className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {workout.exercises.length} exercises
                      </Text>
                    </View>
                    <Text className="text-xs text-muted">
                      {workout.exercises.map((e) => e.exerciseName).join(', ')}
                    </Text>
                    <Text className="text-sm text-foreground font-medium mt-2">
                      Volume: {Math.round(workout.totalVolume).toLocaleString()} kg
                    </Text>
                  </View>
                ))
            )}
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => router.push('/logger')}
                className="bg-primary rounded-xl p-4 active:opacity-80"
              >
                <Text className="text-background font-semibold text-center">Log Workout</Text>
              </TouchableOpacity>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/splits')}
                  className="flex-1 bg-surface border border-border rounded-xl p-4 active:opacity-80"
                >
                  <Text className="text-foreground font-semibold text-center">View Splits</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/progress')}
                  className="flex-1 bg-surface border border-border rounded-xl p-4 active:opacity-80"
                >
                  <Text className="text-foreground font-semibold text-center">Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View className="bg-warning/10 border border-warning rounded-xl p-4 gap-2">
            <Text className="text-sm font-semibold text-warning">💡 Tip</Text>
            <Text className="text-xs text-muted leading-relaxed">
              Track RPE (Rate of Perceived Exertion) for better progression recommendations. Rate difficulty 1-10 after each set.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
