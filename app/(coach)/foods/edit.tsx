import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFoodStore } from '../../../src/presentation/stores/foodStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { FoodType, FOOD_TYPES } from '../../../src/domain/entities/Food';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

const TYPE_LABELS: Record<FoodType, string> = {
  generic:    Strings.foodFilterGeneric,
  specific:   Strings.foodFilterSpecific,
  supplement: Strings.foodFilterSupplement,
};

export default function EditFoodScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { foods, editFood, isSubmitting, error, clearError } = useFoodStore();

  const food = foods.find((f) => f.id === id);

  const [name,     setName]     = useState(food?.name ?? '');
  const [type,     setType]     = useState<FoodType>(food?.type ?? 'generic');
  const [calories, setCalories] = useState(String(food?.caloriesPer100g ?? ''));
  const [protein,  setProtein]  = useState(String(food?.proteinG ?? ''));
  const [carbs,    setCarbs]    = useState(String(food?.carbsG ?? ''));
  const [fat,      setFat]      = useState(String(food?.fatG ?? ''));
  const [fiber,    setFiber]    = useState(String(food?.fiberG ?? ''));

  if (!food) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{Strings.foodEditNotFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGeneric = food.coachId === null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', Strings.foodFormNameRequired);
      return;
    }

    const result = await editFood(
      food,
      {
        name:            name.trim(),
        type,
        caloriesPer100g: parseFloat(calories) || 0,
        proteinG:        parseFloat(protein)  || 0,
        carbsG:          parseFloat(carbs)    || 0,
        fatG:            parseFloat(fat)      || 0,
        fiberG:          parseFloat(fiber)    || 0,
      },
      user!.id,
    );

    if (result) router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>{Strings.foodFormCancel}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.foodEditTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Nota para alimentos genéricos */}
        {isGeneric && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>{Strings.foodEditGenericNote}</Text>
          </View>
        )}

        {/* Error banner */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </TouchableOpacity>
        )}

        {/* Nombre */}
        <Text style={styles.label}>{Strings.foodFormLabelName}</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Pechuga de pollo"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        {/* Tipo */}
        <Text style={styles.label}>{Strings.foodFormLabelType}</Text>
        <View style={styles.optionRow}>
          {FOOD_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.optionChip, styles.optionChipFlex, type === t && styles.optionChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.optionChipText, type === t && styles.optionChipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Macros */}
        <Text style={styles.label}>{Strings.foodFormLabelCalories}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textSecondary}
          value={calories}
          onChangeText={setCalories}
        />

        <View style={styles.macroRow}>
          <View style={styles.macroField}>
            <Text style={styles.label}>{Strings.foodFormLabelProtein}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={protein}
              onChangeText={setProtein}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.label}>{Strings.foodFormLabelCarbs}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroField}>
            <Text style={styles.label}>{Strings.foodFormLabelFat}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={fat}
              onChangeText={setFat}
            />
          </View>
          <View style={styles.macroField}>
            <Text style={styles.label}>{Strings.foodFormLabelFiber}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={fiber}
              onChangeText={setFiber}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitButtonText}>{Strings.foodFormSave}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerSpacer: { width: 60 },
  cancelText:   { color: Colors.primary, fontSize: FontSize.md },
  headerTitle:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  infoBanner: {
    backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  infoText: { color: Colors.primary, fontSize: FontSize.sm },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorBannerText: { color: Colors.error, fontSize: FontSize.sm },
  errorText:       { color: Colors.error, fontSize: FontSize.md },

  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },

  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },

  optionRow:            { flexDirection: 'row', gap: Spacing.xs },
  optionChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  optionChipFlex:       { flex: 1, alignItems: 'center' },
  optionChipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  optionChipTextActive: { color: '#fff' },

  macroRow:   { flexDirection: 'row', gap: Spacing.md },
  macroField: { flex: 1 },

  submitButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText:     { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
