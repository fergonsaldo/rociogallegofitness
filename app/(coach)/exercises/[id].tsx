import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { ExerciseForm } from '../../../src/presentation/components/coach/ExerciseForm';
import { CreateCustomExerciseInput } from '../../../src/domain/entities/CustomExercise';

export default function EditExerciseScreen() {
  const router                               = useRouter();
  const { id }                               = useLocalSearchParams<{ id: string }>();
  const { user }                             = useAuthStore();
  const { exercises, isLoading, update }     = useCustomExerciseStore();

  const exercise = exercises.find((ex) => ex.id === id);

  const handleSubmit = async (input: CreateCustomExerciseInput) => {
    if (!id) return;
    const { coachId: _, ...fields } = input;
    const updated = await update(id, fields);
    if (updated) router.back();
  };

  if (!user) return null;

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.exerciseFormEditTitle}</Text>
        <Text style={styles.subtitle}>{exercise.name}</Text>
      </View>
      <ExerciseForm
        coachId={user.id}
        isLoading={isLoading}
        submitLabel={Strings.exerciseFormEditSubmit}
        initialValues={{
          name:             exercise.name,
          category:         exercise.category,
          primaryMuscles:   exercise.primaryMuscles,
          secondaryMuscles: exercise.secondaryMuscles,
          description:      exercise.description ?? '',
          videoUrl:         exercise.videoUrl     ?? '',
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.background },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:   {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.lg,
    paddingBottom:     Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:    { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
