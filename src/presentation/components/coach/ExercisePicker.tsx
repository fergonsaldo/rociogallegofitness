import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { useState } from 'react';
import { Exercise } from '@/domain/entities/Exercise';
import { EXERCISE_CATALOG } from '@/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: '🏋️ Strength',
  cardio: '🏃 Cardio',
  isometric: '🧘 Isometric',
  flexibility: '🤸 Flexibility',
};

export function ExercisePicker({ onSelect, selectedIds = [] }: ExercisePickerProps) {
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const categories = [...new Set(EXERCISE_CATALOG.map((e) => e.category))];

  const filtered = filter
    ? EXERCISE_CATALOG.filter((e) => e.category === filter)
    : EXERCISE_CATALOG;

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
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
              <Text style={[styles.filterPillText, !filter && styles.filterPillTextActive]}>All</Text>
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

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.primaryMuscles.join(', ')} · {item.isIsometric ? '⏱ Isometric' : '🔁 Reps'}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeButton: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    padding: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    flexWrap: 'wrap',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceMuted,
  },
  filterPillActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  exerciseRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  exerciseRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  exerciseMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: '700',
  },
});
