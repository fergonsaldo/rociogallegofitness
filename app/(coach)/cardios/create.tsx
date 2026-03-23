import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCardioStore } from '../../../src/presentation/stores/cardioStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { CardioType, CardioIntensity, CARDIO_TYPES, CARDIO_INTENSITIES } from '../../../src/domain/entities/Cardio';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

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

export default function CreateCardioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { create, isCreating } = useCardioStore();

  const [name, setName]               = useState('');
  const [type, setType]               = useState<CardioType>('running');
  const [intensity, setIntensity]     = useState<CardioIntensity>('medium');
  const [durationMin, setDurationMin] = useState('20');
  const [durationMax, setDurationMax] = useState('40');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', Strings.cardioFormLabelName + ' es obligatorio');
      return;
    }
    const min = parseInt(durationMin, 10);
    const max = parseInt(durationMax, 10);
    if (!min || !max || max < min) {
      Alert.alert('Error', Strings.cardioFormErrorDurationRange);
      return;
    }

    const result = await create({
      coachId:            user!.id,
      name:               name.trim(),
      type,
      intensity,
      durationMinMinutes: min,
      durationMaxMinutes: max,
      description:        description.trim() || undefined,
    });

    if (result) {
      Alert.alert('✓', Strings.cardioFormSuccess, [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>{Strings.cardioFormCancel}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.cardioFormTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Nombre */}
        <Text style={styles.label}>{Strings.cardioFormLabelName}</Text>
        <TextInput
          style={styles.input}
          placeholder={Strings.cardioFormPlaceholderName}
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        {/* Tipo */}
        <Text style={styles.label}>{Strings.cardioFormLabelType}</Text>
        <View style={styles.optionGrid}>
          {CARDIO_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.optionChip, type === t && styles.optionChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.optionChipText, type === t && styles.optionChipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensidad */}
        <Text style={styles.label}>{Strings.cardioFormLabelIntensity}</Text>
        <View style={styles.optionRow}>
          {CARDIO_INTENSITIES.map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionChip, styles.optionChipFlex, intensity === i && styles.optionChipActive]}
              onPress={() => setIntensity(i)}
            >
              <Text style={[styles.optionChipText, intensity === i && styles.optionChipTextActive]}>
                {INTENSITY_LABELS[i]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duración */}
        <View style={styles.durationRow}>
          <View style={styles.durationField}>
            <Text style={styles.label}>{Strings.cardioFormLabelDurationMin}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={durationMin}
              onChangeText={setDurationMin}
              maxLength={3}
            />
          </View>
          <View style={styles.durationField}>
            <Text style={styles.label}>{Strings.cardioFormLabelDurationMax}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={durationMax}
              onChangeText={setDurationMax}
              maxLength={3}
            />
          </View>
        </View>

        {/* Descripción */}
        <Text style={styles.label}>{Strings.cardioFormLabelDescription}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={Strings.cardioFormPlaceholderDesc}
          placeholderTextColor={Colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isCreating}
        >
          {isCreating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitButtonText}>{Strings.cardioFormSubmit}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerSpacer: { width: 60 },
  cancelText:   { color: Colors.primary, fontSize: FontSize.md },
  headerTitle:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },

  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  optionRow:  { flexDirection: 'row', gap: Spacing.xs },
  optionChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  optionChipFlex:       { flex: 1, alignItems: 'center' },
  optionChipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  optionChipTextActive: { color: '#fff' },

  durationRow:  { flexDirection: 'row', gap: Spacing.md },
  durationField:{ flex: 1 },

  submitButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
