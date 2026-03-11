import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { ExerciseForm } from '../../../src/presentation/components/coach/ExerciseForm';
import { CreateCustomExerciseInput } from '../../../src/domain/entities/CustomExercise';

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLoading, create } = useCustomExerciseStore();

  const handleSubmit = async (input: CreateCustomExerciseInput) => {
    const created = await create(input);
    if (created) router.back();
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.exerciseFormTitle}</Text>
      </View>
      <ExerciseForm
        coachId={user.id}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
});
