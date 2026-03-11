import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { EXERCISE_CATALOG } from '../../../src/shared/constants/exercises';
import { Exercise } from '../../../src/domain/entities/Exercise';
import { ExerciseVideoPlayer } from '../../../src/presentation/components/athlete/ExerciseVideoPlayer';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';

type CategoryFilter = 'all' | Exercise['category'];

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all',         label: Strings.exerciseLibraryFilterAll },
  { key: 'strength',    label: Strings.exerciseCategoryStrength },
  { key: 'cardio',      label: Strings.exerciseCategoryCardio },
  { key: 'isometric',   label: Strings.exerciseCategoryIsometric },
  { key: 'flexibility', label: Strings.exerciseCategoryFlexibility },
];

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos',
  core: 'Core', glutes: 'Glúteos', quadriceps: 'Cuádriceps',
  hamstrings: 'Isquiotibiales', calves: 'Gemelos', full_body: 'Cuerpo completo',
};

function muscleLabel(key: string): string {
  return MUSCLE_LABELS[key] ?? key;
}

export default function ExerciseLibraryScreen() {
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return EXERCISE_CATALOG.filter((ex) => {
      const matchesCategory = activeFilter === 'all' || ex.category === activeFilter;
      const matchesSearch   = !q
        || ex.name.toLowerCase().includes(q)
        || ex.primaryMuscles.some((m) => muscleLabel(m).toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.exerciseLibraryTitle}</Text>
        <Text style={styles.subtitle}>{filtered.length} ejercicios</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.exerciseLibrarySearchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {CATEGORY_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
          </View>
        ) : (
          filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onVideoPress={() => setSelectedExercise(exercise)}
            />
          ))
        )}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Video player modal */}
      {selectedExercise && (
        <ExerciseVideoPlayer
          videoUrl={selectedExercise.videoUrl ?? ''}
          exerciseName={selectedExercise.name}
          visible={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ── ExerciseCard ──────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  onVideoPress: () => void;
}

function ExerciseCard({ exercise, onVideoPress }: ExerciseCardProps) {
  const hasVideo = !!exercise.videoUrl && isValidYouTubeUrl(exercise.videoUrl);

  const categoryColor: Record<Exercise['category'], string> = {
    strength:    Colors.primary,
    cardio:      Colors.athlete,
    isometric:   Colors.success,
    flexibility: '#a78bfa',
  };

  const color = categoryColor[exercise.category];

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{exercise.name}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: `${color}18` }]}>
                <Text style={[styles.categoryBadgeText, { color }]}>
                  {exercise.isIsometric ? Strings.exerciseCategoryIsometric : exercise.category}
                </Text>
              </View>
            </View>
          </View>

          {hasVideo && (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={onVideoPress}
              activeOpacity={0.75}
            >
              <Text style={styles.videoButtonIcon}>▶</Text>
              <Text style={styles.videoButtonText}>{Strings.exerciseVideoButton}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.musclesRow}>
          <Text style={styles.musclesLabel}>{Strings.exercisePrimaryMuscles}: </Text>
          <Text style={styles.musclesValue}>
            {exercise.primaryMuscles.map(muscleLabel).join(', ')}
          </Text>
        </View>

        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.musclesRow}>
            <Text style={styles.musclesLabel}>{Strings.exerciseSecondaryMuscles}: </Text>
            <Text style={styles.musclesValue}>
              {exercise.secondaryMuscles.map(muscleLabel).join(', ')}
            </Text>
          </View>
        )}

        {exercise.description && (
          <Text style={styles.cardDescription}>{exercise.description}</Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  searchClear: { fontSize: FontSize.sm, color: Colors.textMuted, padding: Spacing.xs },

  filtersScroll: { maxHeight: 48 },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },

  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', marginTop: 4, gap: Spacing.xs },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.athlete,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    shadowColor: Colors.athlete,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  videoButtonIcon: { fontSize: 10, color: '#fff' },
  videoButtonText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  musclesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  musclesLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  musclesValue: { fontSize: FontSize.xs, color: Colors.textSecondary },

  cardDescription: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
