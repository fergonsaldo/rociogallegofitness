import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCardioStore } from '../../../src/presentation/stores/cardioStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { CatalogCardio, CardioType, CardioIntensity, CARDIO_TYPES, CARDIO_INTENSITIES } from '../../../src/domain/entities/Cardio';
import { filterCardios } from '../../../src/application/coach/CardioUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { supabase } from '../../../src/infrastructure/supabase/client';

// ── Labels ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<CardioType, string> = {
  running:       Strings.cardioTypeRunning,
  cycling:       Strings.cardioTypeCycling,
  swimming:      Strings.cardioTypeSwimming,
  elliptical:    Strings.cardioTypeElliptical,
  rowing:        Strings.cardioTypeRowing,
  jump_rope:     Strings.cardioTypeJumpRope,
  walking:       Strings.cardioTypeWalking,
  stair_climbing:Strings.cardioTypeStairClimbing,
  other:         Strings.cardioTypeOther,
};

const INTENSITY_LABELS: Record<CardioIntensity, string> = {
  low:    Strings.cardioIntensityLow,
  medium: Strings.cardioIntensityMedium,
  high:   Strings.cardioIntensityHigh,
};

const INTENSITY_COLORS: Record<CardioIntensity, string> = {
  low:    Colors.success,
  medium: Colors.warning,
  high:   Colors.error,
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface AthleteOption {
  id: string;
  full_name: string;
  email: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CoachCardiosScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { catalog, isLoading, error, fetchAll, delete: deleteCardio, assignMultipleToAthlete } =
    useCardioStore();

  const [query, setQuery]                   = useState('');
  const [activeTypes, setActiveTypes]       = useState<CardioType[]>([]);
  const [activeIntensities, setActiveIntensities] = useState<CardioIntensity[]>([]);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode]         = useState(false);

  const [modalVisible, setModalVisible]     = useState(false);
  const [athletes, setAthletes]             = useState<AthleteOption[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [assigningId, setAssigningId]       = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchAll(user.id);
    }, [user?.id]),
  );

  const filtered = filterCardios(catalog, query, activeTypes, activeIntensities);

  // ── Chip toggles ──────────────────────────────────────────────────────────

  const toggleType = (t: CardioType) =>
    setActiveTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const toggleIntensity = (i: CardioIntensity) =>
    setActiveIntensities((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const handleLongPress = (cardio: CatalogCardio) => {
    setSelectMode(true);
    setSelectedIds(new Set([cardio.id]));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  };

  const handlePress = (cardio: CatalogCardio) => {
    if (selectMode) { handleToggleSelect(cardio.id); return; }
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (cardio: CatalogCardio) => {
    Alert.alert(
      Strings.cardioDeleteConfirmTitle,
      Strings.cardioDeleteConfirmMessage(cardio.name),
      [
        { text: Strings.cardioDeleteCancel, style: 'cancel' },
        { text: Strings.cardioDeleteConfirm, style: 'destructive', onPress: () => deleteCardio(cardio.id) },
      ],
    );
  };

  // ── Bulk assign ───────────────────────────────────────────────────────────

  const handleOpenModal = async () => {
    setModalVisible(true);
    setLoadingAthletes(true);
    try {
      const { data, error: err } = await supabase
        .from('coach_athletes')
        .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
        .eq('coach_id', user!.id);
      if (err) throw err;
      setAthletes(((data ?? []) as any[]).map((row) => row.users).filter(Boolean));
    } catch {
      setAthletes([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const handleAssign = async (athlete: AthleteOption) => {
    setAssigningId(athlete.id);
    const ids = Array.from(selectedIds);
    const ok = await assignMultipleToAthlete(ids, athlete.id);
    setAssigningId(null);
    if (ok) {
      setModalVisible(false);
      handleCancelSelect();
      Alert.alert('✓', Strings.cardioBulkAssignSuccess(ids.length, athlete.full_name));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>{Strings.cardioTitle}</Text>
              <Text style={styles.subtitle}>{Strings.cardioSubtitle(catalog.length)}</Text>
            </View>
          </View>
          {selectMode ? (
            <TouchableOpacity onPress={handleCancelSelect} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(coach)/cardios/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>{Strings.cardioNewButton}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.cardioSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Type chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          {CARDIO_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, activeTypes.includes(t) && styles.chipActive]}
              onPress={() => toggleType(t)}
            >
              <Text style={[styles.chipText, activeTypes.includes(t) && styles.chipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Intensity chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          {CARDIO_INTENSITIES.map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, activeIntensities.includes(i) && { backgroundColor: INTENSITY_COLORS[i], borderColor: INTENSITY_COLORS[i] }]}
              onPress={() => toggleIntensity(i)}
            >
              <Text style={[styles.chipText, activeIntensities.includes(i) && styles.chipTextActive]}>
                {INTENSITY_LABELS[i]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bulk-assign bar */}
        {selectMode && selectedIds.size > 0 && (
          <TouchableOpacity style={styles.bulkBar} onPress={handleOpenModal}>
            <Text style={styles.bulkBarCount}>{Strings.cardioSelectionCount(selectedIds.size)}</Text>
            <Text style={styles.bulkBarAction}>{Strings.cardioBulkAssignButton}</Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : catalog.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🏃</Text>
            <Text style={styles.emptyTitle}>{Strings.cardioEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.cardioEmptySubtitle}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(coach)/cardios/create')}>
              <Text style={styles.emptyButtonText}>{Strings.cardioEmptyButton}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.cardioEmptySearch}</Text>
            <Text style={styles.emptySubtitle}>{Strings.cardioEmptySearchSubtitle(query)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardioCard
                cardio={item}
                selected={selectedIds.has(item.id)}
                selectMode={selectMode}
                coachId={user?.id ?? null}
                onPress={handlePress}
                onLongPress={handleLongPress}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Athlete picker modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.assignRoutineTitle}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>
            <Text style={styles.modalSubtitle}>{Strings.assignRoutineSubtitle}</Text>
            {loadingAthletes ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : athletes.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyText}>{Strings.assignRoutineEmpty}</Text>
              </View>
            ) : (
              <FlatList
                data={athletes}
                keyExtractor={(a) => a.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.athleteRow}
                    onPress={() => handleAssign(item)}
                    disabled={assigningId !== null}
                  >
                    <View style={styles.athleteAvatar}>
                      <Text style={styles.athleteAvatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName}>{item.full_name}</Text>
                      <Text style={styles.athleteEmail}>{item.email}</Text>
                    </View>
                    {assigningId === item.id
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <Text style={styles.assignIcon}>＋</Text>
                    }
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.athleteList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── CardioCard ─────────────────────────────────────────────────────────────────

interface CardioCardProps {
  cardio:     CatalogCardio;
  selected:   boolean;
  selectMode: boolean;
  coachId:    string | null;
  onPress:    (c: CatalogCardio) => void;
  onLongPress:(c: CatalogCardio) => void;
  onDelete:   (c: CatalogCardio) => void;
}

function CardioCard({ cardio, selected, selectMode, coachId, onPress, onLongPress, onDelete }: CardioCardProps) {
  const intensity = cardio.intensity as CardioIntensity;
  const isOwn = cardio.coachId !== null && cardio.coachId === coachId;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(cardio)}
      onLongPress={() => onLongPress(cardio)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardAccent, { backgroundColor: INTENSITY_COLORS[intensity] }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{cardio.name}</Text>
          <View style={[styles.intensityBadge, { backgroundColor: `${INTENSITY_COLORS[intensity]}18` }]}>
            <Text style={[styles.intensityText, { color: INTENSITY_COLORS[intensity] }]}>
              {INTENSITY_LABELS[intensity]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardType}>{TYPE_LABELS[cardio.type as CardioType]}</Text>
        <Text style={styles.cardDuration}>
          {cardio.durationMinMinutes}–{cardio.durationMaxMinutes} min
        </Text>
        {cardio.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>{cardio.description}</Text>
        )}
      </View>
      {selectMode ? (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      ) : isOwn ? (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(cardio)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:    { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  cancelButton: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.textSecondary },
  cancelButtonText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  searchInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },

  chipsRow:    { flexGrow: 0, marginBottom: Spacing.xs },
  chipsContent:{ gap: Spacing.xs, paddingRight: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:      { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive:{ color: '#fff' },

  bulkBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
  },
  bulkBarCount:  { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  bulkBarAction: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  cardAccent:   { width: 4 },
  cardContent:  { flex: 1, padding: Spacing.md, gap: 2 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardName:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardType:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardDuration: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  cardDescription: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  intensityBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  intensityText:  { fontSize: FontSize.xs, fontWeight: '700' },

  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.textSecondary,
    alignItems: 'center', justifyContent: 'center', margin: Spacing.md,
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deleteButton: { justifyContent: 'center', paddingHorizontal: Spacing.md },
  deleteIcon:   { fontSize: 18 },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyText:     { fontSize: FontSize.md, color: Colors.textSecondary },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  modalContainer:    { flex: 1, paddingHorizontal: Spacing.lg },
  modalHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  modalHeaderSpacer: { width: 60 },
  modalCancelText:   { color: Colors.primary, fontSize: FontSize.md },
  modalTitle:        { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  athleteList:       { paddingBottom: Spacing.xl },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  athleteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  athleteAvatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  athleteInfo:  { flex: 1 },
  athleteName:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  athleteEmail: { fontSize: FontSize.xs, color: Colors.textSecondary },
  assignIcon:   { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700' },
});
