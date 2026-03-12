import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';
import { Strings } from '@/shared/constants/strings';
import { isValidYouTubeUrl } from '@/shared/utils/youtube';
import { CreateCustomExerciseInput } from '@/domain/entities/CustomExercise';
import { MuscleGroup, ExerciseCategory } from '@/shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { key: ExerciseCategory; label: string }[] = [
  { key: 'strength',    label: Strings.exerciseCategoryStrength },
  { key: 'cardio',      label: Strings.exerciseCategoryCardio },
  { key: 'isometric',   label: Strings.exerciseCategoryIsometric },
  { key: 'flexibility', label: Strings.exerciseCategoryFlexibility },
];

const MUSCLE_OPTIONS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest',      label: 'Pecho' },
  { key: 'back',       label: 'Espalda' },
  { key: 'shoulders',  label: 'Hombros' },
  { key: 'biceps',     label: 'Bíceps' },
  { key: 'triceps',    label: 'Tríceps' },
  { key: 'forearms',   label: 'Antebrazos' },
  { key: 'core',       label: 'Core' },
  { key: 'glutes',     label: 'Glúteos' },
  { key: 'quadriceps', label: 'Cuádriceps' },
  { key: 'hamstrings', label: 'Isquiotibiales' },
  { key: 'calves',     label: 'Gemelos' },
  { key: 'full_body',  label: 'Cuerpo completo' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExerciseFormInitialValues {
  name:             string;
  category:         ExerciseCategory;
  primaryMuscles:   MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  description:      string;
  videoUrl:         string;
}

interface ExerciseFormProps {
  coachId:        string;
  isLoading:      boolean;
  initialValues?: ExerciseFormInitialValues;
  submitLabel?:   string;
  onSubmit:       (input: CreateCustomExerciseInput) => void;
  onCancel:       () => void;
}

interface FormErrors {
  name?:           string;
  primaryMuscles?: string;
  videoUrl?:       string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExerciseForm({
  coachId,
  isLoading,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName]                         = useState(initialValues?.name             ?? '');
  const [category, setCategory]                 = useState<ExerciseCategory>(initialValues?.category ?? 'strength');
  const [primaryMuscles, setPrimaryMuscles]     = useState<MuscleGroup[]>(initialValues?.primaryMuscles   ?? []);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>(initialValues?.secondaryMuscles ?? []);
  const [description, setDescription]           = useState(initialValues?.description ?? '');
  const [videoUrl, setVideoUrl]                 = useState(initialValues?.videoUrl     ?? '');
  const [errors, setErrors]                     = useState<FormErrors>({});

  const isIsometric = category === 'isometric';

  const toggleMuscle = (
    muscle: MuscleGroup,
    list: MuscleGroup[],
    setter: (v: MuscleGroup[]) => void,
    otherList: MuscleGroup[],
  ) => {
    if (otherList.includes(muscle)) return;
    setter(list.includes(muscle) ? list.filter((m) => m !== muscle) : [...list, muscle]);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim())             next.name           = 'El nombre es obligatorio';
    if (!primaryMuscles.length)   next.primaryMuscles = 'Selecciona al menos un músculo principal';
    if (videoUrl.trim() && !isValidYouTubeUrl(videoUrl.trim()))
      next.videoUrl = 'La URL debe ser de YouTube (youtube.com o youtu.be)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      coachId,
      name:             name.trim(),
      category,
      primaryMuscles,
      secondaryMuscles,
      isIsometric,
      description:      description.trim() || undefined,
      videoUrl:         videoUrl.trim()    || undefined,
    });
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Nombre */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exerciseFormName} <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder={Strings.exerciseFormNamePlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          maxLength={100}
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Categoría */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exerciseFormCategory} <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, category === cat.key && styles.chipActive]}
              onPress={() => setCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, category === cat.key && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isIsometric && <Text style={styles.hint}>{Strings.exerciseFormIsometricHint}</Text>}
      </View>

      {/* Músculos principales */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exercisePrimaryMuscles} <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {MUSCLE_OPTIONS.map(({ key, label }) => {
            const isActive   = primaryMuscles.includes(key);
            const isDisabled = secondaryMuscles.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, isActive && styles.chipActive, isDisabled && styles.chipDisabled]}
                onPress={() => toggleMuscle(key, primaryMuscles, setPrimaryMuscles, secondaryMuscles)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive, isDisabled && styles.chipTextDisabled]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.primaryMuscles && <Text style={styles.errorText}>{errors.primaryMuscles}</Text>}
      </View>

      {/* Músculos secundarios */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exerciseSecondaryMuscles}</Text>
        <View style={styles.chipRow}>
          {MUSCLE_OPTIONS.map(({ key, label }) => {
            const isActive   = secondaryMuscles.includes(key);
            const isDisabled = primaryMuscles.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, isActive && styles.chipSecondaryActive, isDisabled && styles.chipDisabled]}
                onPress={() => toggleMuscle(key, secondaryMuscles, setSecondaryMuscles, primaryMuscles)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive, isDisabled && styles.chipTextDisabled]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Descripción */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exerciseFormDescription}</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder={Strings.exerciseFormDescriptionPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

      {/* URL de vídeo */}
      <View style={styles.field}>
        <Text style={styles.label}>{Strings.exerciseFormVideoUrl}</Text>
        <TextInput
          style={[styles.input, errors.videoUrl && styles.inputError]}
          placeholder={Strings.exerciseFormVideoUrlPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={videoUrl}
          onChangeText={(t) => { setVideoUrl(t); setErrors((e) => ({ ...e, videoUrl: undefined })); }}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />
        {errors.videoUrl && <Text style={styles.errorText}>{errors.videoUrl}</Text>}
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>{Strings.exerciseFormCancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitButtonText}>{submitLabel ?? Strings.exerciseFormSubmit}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  field: { marginTop: Spacing.lg, gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  required: { color: Colors.error },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  inputMultiline: { minHeight: 80, paddingTop: Spacing.md },
  inputError: { borderColor: Colors.error },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 2 },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive:          { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  chipSecondaryActive: { backgroundColor: `${Colors.success}15`, borderColor: Colors.success },
  chipDisabled:        { opacity: 0.35 },
  chipText:            { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive:      { color: Colors.primary },
  chipTextDisabled:    { color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelButton: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  cancelButtonText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  submitButton: {
    flex: 2, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
