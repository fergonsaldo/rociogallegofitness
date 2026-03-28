import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert, Platform, Switch,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useScheduleStore } from '../../../src/presentation/stores/scheduleStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

const SLOT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CreateScheduleScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { createSchedule, clearError } = useScheduleStore();

  const today    = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const defaultStartTime = new Date(today);
  defaultStartTime.setHours(9, 0, 0, 0);
  const defaultEndTime = new Date(today);
  defaultEndTime.setHours(18, 0, 0, 0);

  const [title,               setTitle]               = useState('');
  const [startDate,           setStartDate]           = useState<Date>(today);
  const [endDate,             setEndDate]             = useState<Date>(nextMonth);
  const [startTime,           setStartTime]           = useState<Date>(defaultStartTime);
  const [endTime,             setEndTime]             = useState<Date>(defaultEndTime);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [modality,            setModality]            = useState<'online' | 'in_person'>('in_person');
  const [isActive,            setIsActive]            = useState(true);
  const [isSubmitting,        setIsSubmitting]        = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker,   setShowEndDatePicker]   = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker,   setShowEndTimePicker]   = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearError();
    try {
      await createSchedule({
        coachId:             user!.id,
        title:               title.trim(),
        startDate,
        endDate,
        startTime:           dateToTimeString(startTime),
        endTime:             dateToTimeString(endTime),
        slotDurationMinutes,
        modality,
        isActive,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', (err as any)?.message ?? Strings.errorFailedCreateSchedule);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.scheduleFormTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelTitle}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={Strings.scheduleFormPlaceholderTitle}
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
            />
          </View>

          {/* Start date */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelStartDate}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatDate(startDate)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* End date */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelEndDate}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatDate(endDate)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Start time */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelStartTime}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowStartTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatTime(startTime)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* End time */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelEndTime}</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowEndTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerValue}>{formatTime(endTime)}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Slot duration */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelSlotDuration}</Text>
            <View style={styles.chipsRow}>
              {SLOT_DURATION_OPTIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.chip, slotDurationMinutes === min && styles.chipSelected]}
                  onPress={() => setSlotDurationMinutes(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, slotDurationMinutes === min && styles.chipTextSelected]}>
                    {min} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Modality */}
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.scheduleFormLabelModality}</Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, modality === 'in_person' && styles.toggleOptionSelected]}
                onPress={() => setModality('in_person')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, modality === 'in_person' && styles.toggleTextSelected]}>
                  {Strings.schedulesModalityInPerson}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, modality === 'online' && styles.toggleOptionSelected]}
                onPress={() => setModality('online')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, modality === 'online' && styles.toggleTextSelected]}>
                  {Strings.schedulesModalityOnline}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{Strings.scheduleFormLabelActive}</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: Colors.border, true: `${Colors.primary}60` }}
              thumbColor={isActive ? Colors.primary : Colors.textMuted}
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
              : <Text style={styles.submitBtnText}>{Strings.scheduleFormSubmit}</Text>
            }
          </TouchableOpacity>

        </View>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Start date picker */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowStartDatePicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showStartDatePicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* End date picker */}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={startDate}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowEndDatePicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
      {showEndDatePicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowEndDatePicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Start time picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowStartTimePicker(false);
            if (date) setStartTime(date);
          }}
        />
      )}
      {showStartTimePicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowStartTimePicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* End time picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowEndTimePicker(false);
            if (date) setEndTime(date);
          }}
        />
      )}
      {showEndTimePicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowEndTimePicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

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

  form:  { padding: Spacing.lg, gap: Spacing.lg },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },

  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },

  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  pickerValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  pickerArrow: { fontSize: FontSize.lg, color: Colors.textMuted },

  chipsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip:             { borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  chipSelected:     { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  chipText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary },

  toggle:               { flexDirection: 'row', backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, padding: 3 },
  toggleOption:         { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  toggleOptionSelected: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleText:           { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  toggleTextSelected:   { color: Colors.textPrimary },

  switchRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  switchLabel:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },

  submitBtn:         { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  iosBar:     { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm, alignItems: 'flex-end', paddingRight: Spacing.lg },
  iosDoneBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iosDoneText:{ color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
