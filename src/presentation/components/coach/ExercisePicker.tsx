import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Modal, SectionList,
} from 'react-native';
import { useState } from 'react';
import { Exercise } from '@/domain/entities/Exercise';
import { CustomExercise } from '@/domain/entities/CustomExercise';
import { EXERCISE_CATALOG } from '@/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';
import { Strings } from '@/shared/constants/strings';
import { ExerciseVideoPlayer } from '@/presentation/components/athlete/ExerciseVideoPlayer';
import { ExerciseForm } from '@/presentation/components/coach/ExerciseForm';
import { isValidYouTubeUrl } from '@/shared/utils/youtube';
import { useCustomExerciseStore } from '@/presentation/stores/customExerciseStore';

// ── Types ─────────────────────────────────────────────────────────────────────

// Both catalog exercises and custom exercises share the shape we need for display
type PickerExercise = (Exercise | CustomExercise) & { _custom?: boolean };

interface ExercisePickerProps {
  coachId:      string;
  onSelect:     (exercise: Exercise | CustomExercise) => void;
  selectedIds?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  strength:    `🏋️ ${Strings.exerciseCategoryStrength}`,
  cardio:      `🏃 ${Strings.exerciseCategoryCardio}`,
  isometric:   `🧘 ${Strings.exerciseCategoryIsometric}`,
  flexibility: `🤸 ${Strings.exerciseCategoryFlexibility}`,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ExercisePicker({ coachId, onSelect, selectedIds = [] }: ExercisePickerProps) {
  const [visible, setVisible]                 = useState(false);
  const [filter, setFilter]                   = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<PickerExercise | null>(null);
  const [showCreateForm, setShowCreateForm]   = useState(false);

  const { exercises: customExercises, isLoading: creatingExercise, create } = useCustomExerciseStore();

  const categories = [...new Set(EXERCISE_CATALOG.map((e) => e.category))];

  const filteredCustom = filter
    ? customExercises.filter((e) => e.category === filter)
    : customExercises;

  const filteredCatalog = filter
    ? EXERCISE_CATALOG.filter((e) => e.category === filter)
    : [...EXERCISE_CATALOG];

  const sections = [
    ...(filteredCustom.length > 0
      ? [{ title: Strings.exercisePickerMyExercises, data: filteredCustom as PickerExercise[], isCustom: true }]
      : []),
    { title: Strings.exercisePickerCatalog, data: filteredCatalog as PickerExercise[], isCustom: false },
  ];

  const handleSelect = (exercise: PickerExercise) => {
    onSelect(exercise);
    setVisible(false);
  };

  const handleCreateExercise = async (input: Parameters<typeof create>[0]) => {
    const created = await create(input);
    if (created) {
      setShowCreateForm(false);
      onSelect(created);
      setVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Añadir ejercicio</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar ejercicio</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category filter pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, !filter && styles.filterPillActive]}
              onPress={() => setFilter(null)}
            >
              <Text style={[styles.filterPillText, !filter && styles.filterPillTextActive]}>
                {Strings.exerciseLibraryFilterAll}
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, filter === cat && styles.filterPillActive]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[styles.filterPillText, filter === cat && styles.filterPillTextActive]}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botón crear nuevo ejercicio */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateForm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>{Strings.exercisePickerNewExercise}</Text>
          </TouchableOpacity>

          {/* Lista con secciones: Mis ejercicios / Catálogo base */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item, section }) => {
              const isSelected = selectedIds.includes(item.id);
              const hasVideo   = !!item.videoUrl && isValidYouTubeUrl(item.videoUrl);

              return (
                <View style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}>
                  <TouchableOpacity
                    style={styles.exerciseInfo}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.primaryMuscles.join(', ')} · {item.isIsometric ? '⏱ Isométrico' : '🔁 Reps'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.rowActions}>
                    {hasVideo && (
                      <TouchableOpacity
                        style={styles.videoButton}
                        onPress={() => setPreviewExercise(item)}
                        activeOpacity={0.75}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.videoButtonText}>▶</Text>
                      </TouchableOpacity>
                    )}
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>

      {/* Formulario de creación — modal secundario sobre el picker */}
      <Modal visible={showCreateForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{Strings.exerciseFormTitle}</Text>
            <TouchableOpacity onPress={() => setShowCreateForm(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ExerciseForm
            coachId={coachId}
            isLoading={creatingExercise}
            onSubmit={handleCreateExercise}
            onCancel={() => setShowCreateForm(false)}
          />
        </View>
      </Modal>

      {/* Player de vídeo */}
      {previewExercise?.videoUrl && (
        <ExerciseVideoPlayer
          videoUrl={previewExercise.videoUrl}
          exerciseName={previewExercise.name}
          visible={!!previewExercise}
          onClose={() => setPreviewExercise(null)}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  addButton: {
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center',
  },
  addButtonText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  closeButton: { fontSize: FontSize.lg, color: Colors.textSecondary, padding: Spacing.sm },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    flexWrap: 'wrap', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterPill: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surfaceMuted,
  },
  filterPillActive: { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  filterPillText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  filterPillTextActive: { color: Colors.primary, fontWeight: '700' },
  createButton: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.xs,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySubtle, borderWidth: 1.5,
    borderColor: Colors.primary, alignItems: 'center',
  },
  createButtonText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  sectionHeader: {
    paddingVertical: Spacing.sm, paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  sectionHeaderText: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  exerciseRow: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingLeft: Spacing.md, paddingRight: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  exerciseRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  videoButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.athlete,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  videoButtonText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  checkmark: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: '700', width: 24, textAlign: 'center' },
});
