import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { ExerciseForm } from '../../../src/presentation/components/coach/ExerciseForm';
import { CreateCustomExerciseInput, CustomExercise } from '../../../src/domain/entities/CustomExercise';
import { ExerciseVideoPlayer } from '../../../src/presentation/components/athlete/ExerciseVideoPlayer';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';
import { MUSCLE_LABELS } from '../../../src/shared/constants/exercises';
import { supabase } from '../../../src/infrastructure/supabase/client';

export default function ExerciseDetailScreen() {
  const router              = useRouter();
  const { id }              = useLocalSearchParams<{ id: string }>();
  const { user }            = useAuthStore();
  const { update }          = useCustomExerciseStore();

  const [exercise, setExercise]     = useState<CustomExercise | null>(null);
  const [fetching, setFetching]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showVideo, setShowVideo]   = useState(false);
  const [editing, setEditing]       = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setExercise({
            id:               data.id,
            coachId:          data.coach_id ?? '',
            name:             data.name,
            category:         data.category,
            primaryMuscles:   data.primary_muscles,
            secondaryMuscles: data.secondary_muscles,
            isIsometric:      data.is_isometric,
            description:      data.description ?? undefined,
            videoUrl:         data.video_url ?? undefined,
            createdAt:        new Date(data.created_at),
          });
        }
        setFetching(false);
      });
  }, [id]);

  const handleSubmit = async (input: CreateCustomExerciseInput) => {
    if (!id) return;
    setSubmitting(true);
    const { coachId: _, ...fields } = input;
    const updated = await update(id, fields);
    setSubmitting(false);
    if (updated) {
      setExercise(updated);
      setEditing(false);
    }
  };

  if (!user) return null;

  if (fetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Ejercicio no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwn = exercise.coachId === user.id;
  const hasVideo = !!exercise.videoUrl && isValidYouTubeUrl(exercise.videoUrl);

  // ── Modo edición ───────────────────────────────────────────────────────────
  if (editing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{Strings.exerciseFormEditTitle}</Text>
          <Text style={styles.headerSubtitle}>{exercise.name}</Text>
        </View>
        <ExerciseForm
          coachId={user.id}
          isLoading={submitting}
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
          onCancel={() => setEditing(false)}
        />
      </SafeAreaView>
    );
  }

  // ── Vista detalle (todos los ejercicios) ───────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>✏️ Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Nombre y categoría */}
        <Text style={styles.name}>{exercise.name}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{exercise.category.toUpperCase()}</Text>
          </View>
          {exercise.isIsometric && (
            <View style={styles.isometricBadge}>
              <Text style={styles.isometricBadgeText}>⏱ Isométrico</Text>
            </View>
          )}
        </View>

        {/* Músculos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{Strings.exercisePrimaryMuscles.toUpperCase()}</Text>
          <Text style={styles.sectionValue}>
            {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')}
          </Text>
        </View>

        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{Strings.exerciseSecondaryMuscles.toUpperCase()}</Text>
            <Text style={styles.sectionValue}>
              {exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')}
            </Text>
          </View>
        )}

        {exercise.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPCIÓN</Text>
            <Text style={styles.sectionValue}>{exercise.description}</Text>
          </View>
        )}

        {/* Botón de vídeo */}
        {hasVideo && (
          <TouchableOpacity style={styles.videoBtn} onPress={() => setShowVideo(true)} activeOpacity={0.8}>
            <Text style={styles.videoBtnText}>▶ Ver vídeo de técnica</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showVideo && exercise.videoUrl && (
        <ExerciseVideoPlayer
          videoUrl={exercise.videoUrl}
          exerciseName={exercise.name}
          visible={showVideo}
          onClose={() => setShowVideo(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:          { color: Colors.error, fontSize: FontSize.md },
  topbar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  editBtn:            { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.primary },
  editBtnText:        { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  content:            { padding: Spacing.lg, gap: Spacing.md },
  name:               { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  badgeRow:           { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  categoryBadge:      { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  categoryBadgeText:  { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  isometricBadge:     { backgroundColor: `${Colors.success}15`, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  isometricBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.success },
  section:            { gap: 4 },
  sectionLabel:       { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.5 },
  sectionValue:       { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  videoBtn:           { backgroundColor: Colors.athlete, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  videoBtnText:       { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  // edit mode
  header:             { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
