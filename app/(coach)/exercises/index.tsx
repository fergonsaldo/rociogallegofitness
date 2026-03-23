import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { MUSCLE_LABELS, CATEGORY_LABELS } from '../../../src/shared/constants/exercises';
import {
  CatalogExercise,
  applyExerciseFilters,
} from '../../../src/application/coach/CustomExerciseUseCases';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';
import { ExerciseVideoPlayer } from '../../../src/presentation/components/athlete/ExerciseVideoPlayer';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'isometric'] as const;
const MUSCLES    = Object.keys(MUSCLE_LABELS);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CoachExerciseLibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { catalog, isLoading, fetchAll, delete: deleteExercise } = useCustomExerciseStore();

  const [search,           setSearch]           = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeMuscles,    setActiveMuscles]    = useState<string[]>([]);
  const [previewExercise,  setPreviewExercise]  = useState<CatalogExercise | null>(null);

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchAll(user.id);
  }, [user?.id]));

  const filtered = applyExerciseFilters(catalog, search, activeCategories, activeMuscles);

  function toggleCategory(cat: string) {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function toggleMuscle(m: string) {
    setActiveMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  function confirmDelete(exercise: CatalogExercise) {
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
            if (!success) Alert.alert('Error', Strings.exerciseDeleteInUseError);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.exerciseLibraryTitle}</Text>
          <Text style={styles.subtitle}>{filtered.length} ejercicios</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(coach)/exercises/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.newBtnText}>{Strings.coachExerciseNewButton}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={Strings.exerciseLibrarySearchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Muscle filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {MUSCLES.map((m) => {
          const active = activeMuscles.includes(m);
          return (
            <TouchableOpacity
              key={m}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleMuscle(m)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {MUSCLE_LABELS[m]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Sin resultados</Text>
            </View>
          ) : (
            filtered.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                isOwn={ex.coachId === user?.id}
                onPress={() => router.push(`/(coach)/exercises/${ex.id}`)}
                onVideoPress={() => setPreviewExercise(ex)}
                onDelete={() => confirmDelete(ex)}
              />
            ))
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
  exercise:     CatalogExercise;
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
                <Text style={styles.categoryBadgeText}>
                  {CATEGORY_LABELS[exercise.category] ?? exercise.category}
                </Text>
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
                style={styles.videoBtn}
                onPress={(e) => { e.stopPropagation?.(); onVideoPress(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.videoBtnText}>▶</Text>
              </TouchableOpacity>
            )}
            {isOwn && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>🗑</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:             { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:          { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newBtn:            { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newBtnText:        { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  searchContainer:   { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },

  chipsRow:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.xs, flexDirection: 'row' },
  chip:              { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border },
  chipActive:        { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:          { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive:    { color: '#fff' },

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
  videoBtn:          { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.athlete, alignItems: 'center', justifyContent: 'center' },
  videoBtnText:      { fontSize: 11, color: '#fff', fontWeight: '700' },
  deleteBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.error}12`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.error}40` },
  deleteBtnText:     { fontSize: 14 },
  musclesRow:        { flexDirection: 'row', flexWrap: 'wrap' },
  musclesLabel:      { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  musclesValue:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  description:       { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});
