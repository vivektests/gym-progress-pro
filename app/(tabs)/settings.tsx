import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '@/components/screen-container';
import { exerciseStorage } from '@/lib/storage';
import type { Exercise, ExerciseCategory } from '@/lib/types';

const CATEGORIES: ExerciseCategory[] = ['compound', 'isolation', 'cardio'];

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('compound');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const loadExercises = useCallback(async () => setExercises(await exerciseStorage.getAll()), []);
  useFocusEffect(useCallback(() => { loadExercises(); }, [loadExercises]));

  const addExercise = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { Alert.alert('Missing name', 'Enter an exercise name first.'); return; }
    const exercise: Exercise = { id: `custom_${Date.now()}`, name: trimmedName, category };
    await exerciseStorage.add(exercise);
    setExercises((current) => [...current, exercise]);
    setName('');
    Alert.alert('Added', `${trimmedName} is now available in the workout logger.`);
  };

  const removeExercise = (exercise: Exercise) => {
    Alert.alert('Remove exercise?', `Delete ${exercise.name} from your custom list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await exerciseStorage.delete(exercise.id); setExercises((current) => current.filter((item) => item.id !== exercise.id)); } },
    ]);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Custom Exercises</Text>
            <Text className="text-base text-muted">Add movements that are not in the built-in exercise library.</Text>
          </View>

          <View className="bg-surface border border-border rounded-xl p-4 gap-4">
            <Text className="text-base font-semibold text-foreground">Create an exercise</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Exercise name" placeholderTextColor="#687076" className="bg-background border border-border rounded-lg p-3 text-foreground" />
            <View className="flex-row gap-2">
              {CATEGORIES.map((item) => (
                <TouchableOpacity key={item} onPress={() => setCategory(item)} className={`flex-1 rounded-lg p-3 border ${category === item ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                  <Text className={`text-center text-xs font-semibold capitalize ${category === item ? 'text-white' : 'text-foreground'}`}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={addExercise} className="bg-primary rounded-lg p-4 active:opacity-80"><Text className="text-white text-center font-bold">Add Custom Exercise</Text></TouchableOpacity>
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Your custom library ({exercises.length})</Text>
            {exercises.length === 0 ? <Text className="text-sm text-muted">No custom exercises yet.</Text> : exercises.map((exercise) => (
              <View key={exercise.id} className="bg-surface border border-border rounded-lg p-3 flex-row items-center justify-between">
                <View><Text className="font-semibold text-foreground">{exercise.name}</Text><Text className="text-xs text-muted capitalize">{exercise.category}</Text></View>
                <TouchableOpacity onPress={() => removeExercise(exercise)}><Text className="text-error font-semibold">Remove</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
