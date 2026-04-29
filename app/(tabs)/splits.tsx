import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { WORKOUT_SPLITS, getExercisesForSplit } from '@/lib/workout-data';
import { splitStorage, userProfileStorage } from '@/lib/storage';
import type { WorkoutSplit } from '@/lib/types';

export default function SplitsScreen() {
  const [selectedSplit, setSelectedSplit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelectedSplit();
  }, []);

  const loadSelectedSplit = async () => {
    try {
      const selected = await splitStorage.getSelected();
      if (selected) {
        setSelectedSplit(selected.id);
      }
    } catch (error) {
      console.error('Error loading selected split:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSplit = async (split: WorkoutSplit) => {
    try {
      await splitStorage.setSelected(split);
      setSelectedSplit(split.id);

      // Update user profile
      const profile = await userProfileStorage.get();
      if (profile) {
        profile.selectedSplit = split.type;
        await userProfileStorage.set(profile);
      }

      Alert.alert('Success', `Selected ${split.name} split`);
    } catch (error) {
      console.error('Error selecting split:', error);
      Alert.alert('Error', 'Failed to select split');
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Workout Splits</Text>
            <Text className="text-base text-muted">Choose a training split based on your experience</Text>
          </View>

          {/* Splits List */}
          <View className="gap-4">
            {WORKOUT_SPLITS.map((split) => {
              const exercises = getExercisesForSplit(split.id);
              const isSelected = selectedSplit === split.id;

              return (
                <TouchableOpacity
                  key={split.id}
                  onPress={() => handleSelectSplit(split)}
                  className={`rounded-xl p-4 border-2 active:opacity-80 ${
                    isSelected ? 'bg-primary/10 border-primary' : 'bg-surface border-border'
                  }`}
                >
                  {/* Header */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 gap-1">
                      <Text className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {split.name}
                      </Text>
                      <Text className="text-xs text-muted">{split.description}</Text>
                    </View>
                    {isSelected && (
                      <View className="bg-success px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">Selected</Text>
                      </View>
                    )}
                  </View>

                  {/* Details */}
                  <View className="gap-2 mb-3">
                    <View className="flex-row gap-4">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-muted">Days/Week:</Text>
                        <Text className="text-sm font-semibold text-foreground">{split.daysPerWeek}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-muted">Exercises:</Text>
                        <Text className="text-sm font-semibold text-foreground">{exercises.length}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Days */}
                  <View className="gap-2">
                    {split.days.map((day) => (
                      <View key={day.id} className="bg-background/50 rounded-lg p-2">
                        <Text className="text-xs font-semibold text-foreground mb-1">{day.name}</Text>
                        <Text className="text-xs text-muted">{day.exercises.length} exercises</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info Section */}
          <View className="bg-primary/10 border border-primary rounded-xl p-4 gap-2">
            <Text className="text-sm font-semibold text-primary">ℹ️ About Splits</Text>
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold">Push/Pull/Legs:</Text> Best for intermediate lifters. High frequency, high volume.
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold">Upper/Lower:</Text> Balanced approach. 4 days/week. Great for beginners and busy schedules.
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold">Full Body:</Text> Ideal for beginners. 3 days/week. Trains all muscles every session.
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold">Bro Split:</Text> Advanced. 5 days/week. One muscle group per day. High volume per muscle.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
