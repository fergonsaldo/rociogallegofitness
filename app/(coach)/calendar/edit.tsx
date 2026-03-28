import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
  Modal, FlatList, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCoachCalendarStore } from '../../../src/presentation/stores/coachCalendarStore';
import { CoachRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachRemoteRepository';
import { getCoachAthletesUseCase } from '../../../src/application/coach/ClientUseCases';
import { CoachAthlete } from '../../../src/domain/repositories/ICoachRepository';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  Strings.sessionTypeEntrenamiento,
  Strings.sessionTypeEvaluacion,
  Strings.sessionTypeSeguimiento,
  Strings.sessionTypeNutricion,
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const coachRepo = new CoachRemoteRepository();

// ── Screen ────────────────────────────────────────────────────────────────────

export default function EditSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions, rangeSessions, editSession, error, clearError } = useCoachCalendarStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = [...sessions, ...rangeSessions].find((s) => s.id === id);

  const [title,           setTitle]           = useState(session?.title ?? '');
  const [sessionType,     setSessionType]     = useState(session?.sessionType ?? SESSION_TYPES[0]);
  const [modality,        setModality]        = useState<'online' | 'in_person'>(session?.modality ?? 'in_person');
  const [scheduledAt,     setScheduledAt]     = useState<Date>(session?.scheduledAt ?? new Date());
  const [durationMinutes, setDurationMinutes] = useState(session?.durationMinutes ?? 60);
  const [notes,           setNotes]           = useState(session?.notes ?? '');
  const [athleteId,       setAthleteId]       = useState<string | null>(session?.athleteId ?? null);
  const [athleteName,     setAthleteName]     = useState<string>(session?.athleteName ?? Strings.sessionFormAthleteNone);

  const [athletes,          setAthletes]          = useState<CoachAthlete[]>([]);
  const [showAthletePicker, setShowAthletePicker] = useState(false);
  const [showDatePicker,    setShowDatePicker]    = useState(false);
  const [showTimePicker,    setShowTimePicker]    = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);

  useEffect(() => {
    if (user?.id) {
      getCoachAthletesUseCase(user.id, coachRepo)
        .then(setAthletes)
        .catch(() => {/* non-blocking */});
    }
  }, [user?.id]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Sesión no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  function mergeDateTime(base: Date, timeSrc: Date): Date {
    return new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      timeSrc.getHours(), timeSrc.getMinutes(), 0,
    );
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await editSession(id, {
        athleteId:       athleteId,
        title:           title.trim() || null,
        sessionType,
        modality,
        scheduledAt,
        durationMinutes,
        notes:           notes.trim() || null,
      }, user!.id);
      Alert.alert('✓', Strings.sessionEditSuccess, [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      // Error shown via useEffect above
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.sessionEditTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelTitle}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={Strings.sessionFormPlaceholderTitle}
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />
          </View>

          {/* Session type */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelType}</Text>
            <View style={styles.chipsRow}>
              {SESSION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, sessionType === type && styles.chipSelected]}
                  onPress={() => setSessionType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, sessionType === type && styles.chipTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Modality */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelModality}</Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, modality === 'in_person' && styles.toggleOptionSelected]}
                onPress={() => setModality('in_person')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, modality === 'in_person' && styles.toggleTextSelected]}>
                  {Strings.sessionFormModalityInPerson}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, modality === 'online' && styles.toggleOptionSelected]}
                onPress={() => setModality('online')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, modality === 'online' && styles.toggleTextSelected]}>
                  {Strings.sessionFormModalityOnline}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelDate}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatDate(scheduledAt)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelTime}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatTime(scheduledAt)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Duration */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelDuration}</Text>
            <View style={styles.chipsRow}>
              {DURATION_OPTIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.chip, durationMinutes === min && styles.chipSelected]}
                  onPress={() => setDurationMinutes(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, durationMinutes === min && styles.chipTextSelected]}>
                    {Strings.sessionFormDurationMinutes(min)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Athlete */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelAthlete}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowAthletePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerValue, !athleteId && { color: Colors.textMuted }]}>
                {athleteName}
              </Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.sessionFormLabelNotes}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder={Strings.sessionFormPlaceholderNotes}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>{Strings.sessionEditSubmit}</Text>
            }
          </TouchableOpacity>

        </View>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={scheduledAt}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShowDatePicker(false);
            if (date) setScheduledAt(mergeDateTime(date, scheduledAt));
          }}
        />
      )}

      {showDatePicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerDoneBar}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.iosPickerDoneBtn}>
            <Text style={styles.iosPickerDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Time picker */}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledAt}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShowTimePicker(false);
            if (date) setScheduledAt(mergeDateTime(scheduledAt, date));
          }}
        />
      )}

      {showTimePicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerDoneBar}>
          <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.iosPickerDoneBtn}>
            <Text style={styles.iosPickerDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Athlete picker modal */}
      <Modal
        visible={showAthletePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAthletePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{Strings.sessionFormLabelAthlete}</Text>
              <TouchableOpacity onPress={() => setShowAthletePicker(false)} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneText}>{Strings.tagPickerDone}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.athleteRow, !athleteId && styles.athleteRowSelected]}
              onPress={() => { setAthleteId(null); setAthleteName(Strings.sessionFormAthleteNone); setShowAthletePicker(false); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.athleteName, !athleteId && styles.athleteNameSelected]}>
                {Strings.sessionFormAthleteNone}
              </Text>
              {!athleteId && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <FlatList
              data={athletes}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.athleteRow, athleteId === item.id && styles.athleteRowSelected]}
                  onPress={() => { setAthleteId(item.id); setAthleteName(item.fullName); setShowAthletePicker(false); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.athleteAvatar}>
                    <Text style={styles.athleteAvatarText}>
                      {(item.fullName[0] ?? '?').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.athleteInfo}>
                    <Text style={[styles.athleteName, athleteId === item.id && styles.athleteNameSelected]}>
                      {item.fullName}
                    </Text>
                    <Text style={styles.athleteEmail}>{item.email}</Text>
                  </View>
                  {athleteId === item.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              )}
              style={styles.athleteList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  form: { padding: Spacing.lg, gap: Spacing.lg },

  field: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.xs, fontWeight: '600',
    color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase',
  },

  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  inputMultiline: { height: 80, paddingTop: Spacing.md },

  chipsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  chipSelected:     { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  chipText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary },

  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  toggleOption: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  toggleOptionSelected: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  toggleTextSelected: { color: Colors.textPrimary },

  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  pickerValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  pickerArrow: { fontSize: FontSize.lg, color: Colors.textMuted },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  iosPickerDoneBar: {
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.sm, alignItems: 'flex-end', paddingRight: Spacing.lg,
  },
  iosPickerDoneBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iosPickerDoneText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%', paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  modalDoneBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  modalDoneText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  athleteList: { flex: 1 },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  athleteRowSelected: { backgroundColor: Colors.primarySubtle },
  athleteAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  athleteAvatarText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  athleteInfo:       { flex: 1, gap: 2 },
  athleteName:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  athleteNameSelected: { color: Colors.primary },
  athleteEmail:  { fontSize: FontSize.xs, color: Colors.textMuted },
  checkMark:     { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.md, color: Colors.error },
});
