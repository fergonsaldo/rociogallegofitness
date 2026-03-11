import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { CustomExercise } from '../../../src/domain/entities/CustomExercise';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';
import { ExerciseVideoPlayer } from '../../../src/presentation/components/athlete/ExerciseVideoPlayer';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos',
  core: 'Core', glutes: 'Glúteos', quadriceps: 'Cuádriceps',
  hamstrings: 'Isquiotibiales', calves: 'Gemelos', full_body: 'Cuerpo completo',
};

export default function CoachExerciseLibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { exercises, isLoading, error, fetchByCoach } = useCustomExerciseStore();
  const [previewExercise, setPreviewExercise] = useState<CustomExercise | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchByCoach(user.id);
    }, [user?.id]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.coachExerciseLibraryTitle}</Text>
          <Text style={styles.subtitle}>{exercises.length} ejercicios creados</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(coach)/exercises/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>{Strings.coachExerciseNewButton}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏋️</Text>
          <Text style={styles.emptyText}>{Strings.coachExerciseLibraryEmpty}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(coach)/exercises/create')}
          >
            <Text style={styles.emptyButtonText}>{Strings.coachExerciseNewButton}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onVideoPress={() => setPreviewExercise(ex)}
            />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      {previewExercise?.videoUrl && (
        <ExerciseVideoPlayer
          videoUrl={previewExercise.videoUrl}
          exerciseName={previewExercise.name}
          visible={!!previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ExerciseCard({
  exercise,
  onVideoPress,
}: {
  exercise: CustomExercise;
  onVideoPress: () => void;
}) {
  const hasVideo = !!exercise.videoUrl && isValidYouTubeUrl(exercise.videoUrl);

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{exercise.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{exercise.category}</Text>
              </View>
              {exercise.isIsometric && (
                <View style={styles.isometricBadge}>
                  <Text style={styles.isometricBadgeText}>⏱ isométrico</Text>
                </View>
              )}
            </View>
          </View>
          {hasVideo && (
            <TouchableOpacity style={styles.videoButton} onPress={onVideoPress} activeOpacity={0.8}>
              <Text style={styles.videoButtonText}>▶</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.musclesRow}>
          <Text style={styles.musclesLabel}>{Strings.exercisePrimaryMuscles}: </Text>
          <Text style={styles.musclesValue}>
            {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')}
          </Text>
        </View>

        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.musclesRow}>
            <Text style={styles.musclesLabel}>{Strings.exerciseSecondaryMuscles}: </Text>
            <Text style={styles.musclesValue}>
              {exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')}
            </Text>
          </View>
        )}

        {exercise.description && (
          <Text style={styles.description}>{exercise.description}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  newButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardAccent: { width: 4, backgroundColor: Colors.primary },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  categoryBadge: {
    backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  isometricBadge: {
    backgroundColor: `${Colors.success}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  isometricBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  videoButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.athlete,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  videoButtonText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  musclesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  musclesLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  musclesValue: { fontSize: FontSize.xs, color: Colors.textSecondary },
  description: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});
