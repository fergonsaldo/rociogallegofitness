import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, ScrollView,
  Modal, FlatList,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useTagAutomationStore } from '../../../src/presentation/stores/tagAutomationStore';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useCardioStore } from '../../../src/presentation/stores/cardioStore';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── PickerModal ───────────────────────────────────────────────────────────────

function PickerModal<T extends { id: string; name: string }>({
  visible,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible:    boolean;
  items:      T[];
  selectedId: string | null;
  onSelect:   (item: T | null) => void;
  onClose:    () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{Strings.tagAutomationPickerDone}</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{Strings.tagAutomationPickerDone}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.pickerRow, selectedId === null && styles.pickerRowSelected]}
            onPress={() => { onSelect(null); onClose(); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.pickerRowText, selectedId === null && styles.pickerRowTextSelected]}>
              {Strings.tagAutomationPickerClear}
            </Text>
          </TouchableOpacity>

          {items.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>{Strings.tagAutomationEmpty}</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerRow, selectedId === item.id && styles.pickerRowSelected]}
                  onPress={() => { onSelect(item); onClose(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerRowText, selectedId === item.id && styles.pickerRowTextSelected]}>
                    {item.name}
                  </Text>
                  {selectedId === item.id && <Text style={styles.pickerCheck}>✓</Text>}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: Spacing.xxl }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── SectionPicker ─────────────────────────────────────────────────────────────

function SectionPicker({
  label,
  selectedName,
  onPress,
}: {
  label:        string;
  selectedName: string;
  onPress:      () => void;
}) {
  const hasValue = selectedName !== Strings.tagAutomationNone;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TouchableOpacity style={styles.sectionPicker} onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.sectionPickerText, !hasValue && styles.sectionPickerTextMuted]}>
          {selectedName}
        </Text>
        <Text style={styles.sectionPickerArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TagAutomationScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { id: tagId, name: tagName } = useLocalSearchParams<{ id: string; name: string }>();

  const { automations, isSaving, fetchAutomation, saveAutomation, deleteAutomation } =
    useTagAutomationStore();

  const { routines, fetchCoachRoutines }           = useRoutineStore();
  const { catalog: cardios, fetchAll: fetchCardios } = useCardioStore();
  const { coachPlans, fetchCoachPlans }             = useNutritionStore();

  const existing = automations[tagId];

  const [routineId,       setRoutineId]       = useState<string | null>(null);
  const [routineName,     setRoutineName]     = useState(Strings.tagAutomationNone);
  const [cardioId,        setCardioId]        = useState<string | null>(null);
  const [cardioName,      setCardioName]      = useState(Strings.tagAutomationNone);
  const [nutritionPlanId, setNutritionPlanId] = useState<string | null>(null);
  const [nutritionName,   setNutritionName]   = useState(Strings.tagAutomationNone);

  const [showRoutinePicker,   setShowRoutinePicker]   = useState(false);
  const [showCardioPicker,    setShowCardioPicker]    = useState(false);
  const [showNutritionPicker, setShowNutritionPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    if (!user?.id || !tagId) return;

    Promise.all([
      fetchAutomation(tagId),
      fetchCoachRoutines(user.id),
      fetchCardios(user.id),
      fetchCoachPlans(user.id),
    ]).finally(() => setIsLoading(false));
  }, [user?.id, tagId]);

  // Sync form when automation loads
  useEffect(() => {
    if (existing === undefined) return;
    if (existing === null) {
      setRoutineId(null);       setRoutineName(Strings.tagAutomationNone);
      setCardioId(null);        setCardioName(Strings.tagAutomationNone);
      setNutritionPlanId(null); setNutritionName(Strings.tagAutomationNone);
      return;
    }
    const r = routines.find((x) => x.id === existing.routineId);
    const c = cardios.find((x) => x.id === existing.cardioId);
    const n = coachPlans.find((x) => x.id === existing.nutritionPlanId);
    setRoutineId(existing.routineId ?? null);
    setRoutineName(r?.name ?? (existing.routineId ? existing.routineId : Strings.tagAutomationNone));
    setCardioId(existing.cardioId ?? null);
    setCardioName(c?.name ?? (existing.cardioId ? existing.cardioId : Strings.tagAutomationNone));
    setNutritionPlanId(existing.nutritionPlanId ?? null);
    setNutritionName(n?.name ?? (existing.nutritionPlanId ? existing.nutritionPlanId : Strings.tagAutomationNone));
  }, [existing, routines, cardios, coachPlans]);

  const handleSave = useCallback(async () => {
    try {
      await saveAutomation(tagId, { routineId, cardioId, nutritionPlanId });
      Alert.alert(Strings.tagAutomationSaveSuccess);
      router.back();
    } catch {
      // error already in store
    }
  }, [tagId, routineId, cardioId, nutritionPlanId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      Strings.tagAutomationTitle,
      Strings.tagAutomationDeleteConfirm,
      [
        { text: Strings.tagAutomationDeleteCancel, style: 'cancel' },
        {
          text: Strings.tagAutomationDeleteOk,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAutomation(tagId);
              Alert.alert(Strings.tagAutomationDeleteSuccess);
              router.back();
            } catch {
              // error already in store
            }
          },
        },
      ],
    );
  }, [tagId]);

  const routineItems   = routines.map((r) => ({ id: r.id, name: r.name }));
  const cardioItems    = cardios.map((c) => ({ id: c.id, name: c.name }));
  const nutritionItems = coachPlans.map((p) => ({ id: p.id, name: p.name }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{Strings.tagAutomationTitle}</Text>
          <Text style={styles.subtitle}>{Strings.tagAutomationSubtitle(tagName ?? '')}</Text>
        </View>

        <Text style={styles.description}>{Strings.tagAutomationDescription}</Text>

        {/* Pickers */}
        <SectionPicker
          label={Strings.tagAutomationSectionRoutine}
          selectedName={routineName}
          onPress={() => setShowRoutinePicker(true)}
        />
        <SectionPicker
          label={Strings.tagAutomationSectionCardio}
          selectedName={cardioName}
          onPress={() => setShowCardioPicker(true)}
        />
        <SectionPicker
          label={Strings.tagAutomationSectionNutrition}
          selectedName={nutritionName}
          onPress={() => setShowNutritionPicker(true)}
        />

        {/* Actions */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>{Strings.tagAutomationSave}</Text>
          }
        </TouchableOpacity>

        {existing && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>{Strings.tagAutomationDelete}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Picker modals */}
      <PickerModal
        visible={showRoutinePicker}
        items={routineItems}
        selectedId={routineId}
        onSelect={(item) => {
          setRoutineId(item?.id ?? null);
          setRoutineName(item?.name ?? Strings.tagAutomationNone);
        }}
        onClose={() => setShowRoutinePicker(false)}
      />
      <PickerModal
        visible={showCardioPicker}
        items={cardioItems}
        selectedId={cardioId}
        onSelect={(item) => {
          setCardioId(item?.id ?? null);
          setCardioName(item?.name ?? Strings.tagAutomationNone);
        }}
        onClose={() => setShowCardioPicker(false)}
      />
      <PickerModal
        visible={showNutritionPicker}
        items={nutritionItems}
        selectedId={nutritionPlanId}
        onSelect={(item) => {
          setNutritionPlanId(item?.id ?? null);
          setNutritionName(item?.name ?? Strings.tagAutomationNone);
        }}
        onClose={() => setShowNutritionPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: Colors.background },
  center:                { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:               { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  header:                { gap: 2 },
  title:                 { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:              { fontSize: FontSize.sm, color: Colors.textSecondary },
  description:           { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  section:               { gap: Spacing.xs },
  sectionLabel:          { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionPicker:         { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionPickerText:     { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  sectionPickerTextMuted:{ color: Colors.textMuted, fontWeight: '400' },
  sectionPickerArrow:    { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '300' },
  saveBtn:               { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  saveBtnDisabled:       { opacity: 0.5 },
  saveBtnText:           { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  deleteBtn:             { borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: `${Colors.error}50` },
  deleteBtnText:         { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },

  // Picker modal
  overlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet:           { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '60%', paddingBottom: Spacing.xxl },
  pickerHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerTitle:           { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  doneBtn:               { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  doneBtnText:           { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  pickerRow:             { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerRowSelected:     { backgroundColor: Colors.primarySubtle },
  pickerRowText:         { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  pickerRowTextSelected: { fontWeight: '700', color: Colors.primary },
  pickerCheck:           { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  pickerEmpty:           { padding: Spacing.xl, alignItems: 'center' },
  pickerEmptyText:       { color: Colors.textMuted, fontSize: FontSize.sm },
});
