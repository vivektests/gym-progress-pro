import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { workoutStorage } from '@/lib/storage';
import {
  getWeeklyVolumeTrend,
  calculateProgressTrend,
  estimateProgressMetrics,
  getWeekStart,
  calculateWeeklyProgress,
} from '@/lib/analytics';
import type { WorkoutSession } from '@/lib/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [volumeTrend, setVolumeTrend] = useState<number[]>([]);
  const [metrics, setMetrics] = useState({
    volumeGrowth: 0,
    consistency: 0,
    workoutCount: 0,
    averageWeeklyVolume: 0,
  });
  const [timeRange, setTimeRange] = useState<'4' | '12' | '26'>('12');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [timeRange])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const allWorkouts = await workoutStorage.getAll();
      setWorkouts(allWorkouts);

      const weeks = parseInt(timeRange);
      const trend = getWeeklyVolumeTrend(allWorkouts, weeks);
      setVolumeTrend(trend);

      const prog = estimateProgressMetrics(allWorkouts, weeks);
      setMetrics(prog);
    } catch (error) {
      console.error('Error loading progress data:', error);
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

  // Calculate max volume for chart scaling
  const maxVolume = Math.max(...volumeTrend, 1);
  const chartHeight = 200;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Progress Tracking</Text>
            <Text className="text-base text-muted">Visualize your strength journey</Text>
          </View>

          {/* Time Range Selector */}
          <View className="flex-row gap-2">
            {(['4', '12', '26'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                className={`flex-1 py-2 px-3 rounded-lg border active:opacity-80 ${
                  timeRange === range
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    timeRange === range ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {range === '4' ? '1M' : range === '12' ? '3M' : '6M'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Key Metrics */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Key Metrics</Text>
            <View className="gap-3">
              {/* Volume Growth */}
              <View className="bg-surface border border-border rounded-xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted">Volume Growth</Text>
                  <Text className={`text-2xl font-bold ${metrics.volumeGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                    {metrics.volumeGrowth > 0 ? '+' : ''}{metrics.volumeGrowth.toFixed(1)}%
                  </Text>
                </View>
                <View className="w-full bg-border rounded-full h-2">
                  <View
                    className="bg-success rounded-full h-2"
                    style={{
                      width: `${Math.min(Math.abs(metrics.volumeGrowth) / 2, 100)}%`,
                    }}
                  />
                </View>
              </View>

              {/* Consistency */}
              <View className="bg-surface border border-border rounded-xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted">Consistency Score</Text>
                  <Text className="text-2xl font-bold text-primary">{metrics.consistency}%</Text>
                </View>
                <View className="w-full bg-border rounded-full h-2">
                  <View
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${metrics.consistency}%`,
                    }}
                  />
                </View>
              </View>

              {/* Workouts */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface border border-border rounded-xl p-4">
                  <Text className="text-sm text-muted mb-1">Total Workouts</Text>
                  <Text className="text-2xl font-bold text-foreground">{metrics.workoutCount}</Text>
                </View>
                <View className="flex-1 bg-surface border border-border rounded-xl p-4">
                  <Text className="text-sm text-muted mb-1">Avg Weekly</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {Math.round(metrics.averageWeeklyVolume).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-muted">kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Volume Chart */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Weekly Volume Trend</Text>
            <View className="bg-surface border border-border rounded-xl p-4">
              {volumeTrend.length > 0 ? (
                <View style={{ height: chartHeight }} className="flex-row items-flex-end gap-1 justify-between">
                  {volumeTrend.map((volume, index) => {
                    const height = (volume / maxVolume) * (chartHeight - 20);
                    const isRecent = index === volumeTrend.length - 1;

                    return (
                      <View
                        key={index}
                        className="flex-1 items-center gap-1"
                        style={{
                          height: chartHeight,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <View
                          className={`w-full rounded-t-lg ${isRecent ? 'bg-primary' : 'bg-primary/50'}`}
                          style={{
                            height: Math.max(height, 4),
                          }}
                        />
                        <Text className="text-xs text-muted text-center w-full">
                          {index % 2 === 0 ? `W${index + 1}` : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="h-48 items-center justify-center">
                  <Text className="text-muted">No data yet. Start logging workouts!</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Table */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Weekly Breakdown</Text>
            <View className="bg-surface border border-border rounded-xl overflow-hidden">
              {volumeTrend.length > 0 ? (
                volumeTrend.slice(-4).map((volume, index) => (
                  <View
                    key={index}
                    className={`flex-row justify-between items-center p-3 border-b border-border ${
                      index === volumeTrend.slice(-4).length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <Text className="text-sm text-muted">Week {volumeTrend.length - 3 + index}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {Math.round(volume).toLocaleString()} kg
                    </Text>
                  </View>
                ))
              ) : (
                <View className="p-4 items-center">
                  <Text className="text-muted">No data available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tips */}
          <View className="bg-warning/10 border border-warning rounded-xl p-4 gap-2">
            <Text className="text-sm font-semibold text-warning">💡 Progress Tips</Text>
            <Text className="text-xs text-muted leading-relaxed">
              Aim for 5-10% weekly volume increase for optimal progress. Consistency matters more than intensity.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
