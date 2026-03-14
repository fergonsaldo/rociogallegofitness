import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';
import { ExerciseVideoPlayer } from '../../../src/presentation/components/athlete/ExerciseVideoPlayer';
import { supabase } from '../../../src/infrastructure/supabase/client';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos',
  core: 'Core', glutes: 'Glúteos', quadriceps: 'Cuádriceps',
  hamstrings: 'Isquiotibiales', calves: 'Gemelos', full_body: 'Cuerpo completo',
};

interface Exercise {
  id:               string;
  coachId:          string | null;
  name:             string;
  category:         string;
  primaryMuscles:   string[];
  secondaryMuscles: string[];
  isIsometric:      boolean;
  description?:     string;
  videoUrl?:        string;
}

export default function CoachExerciseLibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { delete: deleteExercise } = useCustomExerciseStore();

  const [exercises, setExercises]             = useState<Exercise[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercises((data ?? []).map((row: any) => ({
        id:               row.id,
        coachId:          row.coach_id ?? null,
        name:             row.name,
        category:         row.category,
        primaryMuscles:   row.primary_muscles ?? [],
        secondaryMuscles: row.secondary_muscles ?? [],
        isIsometric:      row.is_isometric,
        description:      row.description ?? undefined,
        videoUrl:         row.video_url ?? undefined,
      })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const handleDelete = (exercise: Exercise) => {
    Alert.alert(
      Strings.exerciseDeleteConfirmTitle,
      `${Strings.exerciseDeleteConfirmMessage}\n\n"${exercise.name}"`,
      [
        { text: Strings.exerciseDeleteCancel, style: 'cancel' },
        {
          text: Strings.exerciseDeleteConfirm,
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExercise(exercise.id);
            if (!success) {
              Alert.alert('Error', Strings.exerciseDeleteInUseError);
            } else {
              setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
            }
          },
        },
      ],
    );
  };

  const filtered = search.trim().length > 0
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
      )
    : exercises;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.coachExerciseLibraryTitle}</Text>
          <Text style={styles.subtitle}>{exercises.length} ejercicios</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(coach)/exercises/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>{Strings.coachExerciseNewButton}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ejercicio…"
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
            </View>
          ) : (
            filtered.map((ex) => {
              const isOwn = ex.coachId === user?.id;
              return (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  isOwn={isOwn}
                  onPress={() => router.push(`/(coach)/exercises/${ex.id}`)}
                  onVideoPress={() => setPreviewExercise(ex)}
                  onDelete={() => handleDelete(ex)}
                />
              );
            })
          )}
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

// ── ExerciseCard ──────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise, isOwn, onPress, onVideoPress, onDelete,
}: {
  exercise:     Exercise;
  isOwn:        boolean;
  onPress:      () => void;
  onVideoPress: () => void;
  onDelete:     () => void;
}) {
  const hasVideo = !!exercise.videoUrl && isValidYouTubeUrl(exercise.videoUrl);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
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

          <View style={styles.cardActions}>
            {hasVideo && (
              <TouchableOpacity
                style={styles.videoButton}
                onPress={(e) => { e.stopPropagation?.(); onVideoPress(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.videoButtonText}>▶</Text>
              </TouchableOpacity>
            )}
            {isOwn && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:             { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:          { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newButton:         { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newButtonText:     { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  searchContainer:   { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:        { fontSize: 36 },
  emptyText:         { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  list:              { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },
  card:              { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  cardAccent:        { width: 4, alignSelf: 'stretch', backgroundColor: Colors.primary },
  cardBody:          { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardTop:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  cardInfo:          { flex: 1 },
  cardName:          { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  badgeRow:          { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  categoryBadge:     { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  isometricBadge:    { backgroundColor: `${Colors.success}15`, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  isometricBadgeText:{ fontSize: 11, fontWeight: '600', color: Colors.success },
  cardActions:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  videoButton:       { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.athlete, alignItems: 'center', justifyContent: 'center' },
  videoButtonText:   { fontSize: 11, color: '#fff', fontWeight: '700' },
  deleteButton:      { width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.error}12`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.error}40` },
  deleteButtonText:  { fontSize: 14 },
  musclesRow:        { flexDirection: 'row', flexWrap: 'wrap' },
  musclesLabel:      { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  musclesValue:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  description:       { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});
