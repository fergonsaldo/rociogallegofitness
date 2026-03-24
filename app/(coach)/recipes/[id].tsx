import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { computeRecipeMacros } from '../../../src/application/coach/RecipeUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentRecipe, isLoading, error, fetchRecipeDetail, clearCurrentRecipe } = useRecipeStore();

  useFocusEffect(
    useCallback(() => {
      if (id && user?.id) fetchRecipeDetail(id, user.id);
      return () => clearCurrentRecipe();
    }, [id, user?.id]),
  );

  if (isLoading || !currentRecipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {error
            ? <Text style={styles.errorText}>{error}</Text>
            : <ActivityIndicator color={Colors.primary} size="large" />
          }
        </View>
      </SafeAreaView>
    );
  }

  const macros = computeRecipeMacros(currentRecipe.ingredients);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/(coach)/recipes/edit', params: { id: currentRecipe.id } } as any)}
          >
            <Text style={styles.editButtonText}>{Strings.recipeDetailEditButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        {currentRecipe.imageUrl && (
          <Image source={{ uri: currentRecipe.imageUrl }} style={styles.image} />
        )}

        {/* Title + tags */}
        <Text style={styles.title}>{currentRecipe.name}</Text>
        {currentRecipe.tags.length > 0 && (
          <View style={styles.tagRow}>
            {currentRecipe.tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagPillText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Macros */}
        {currentRecipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{Strings.recipeDetailMacros}</Text>
            <View style={styles.macroGrid}>
              <MacroCell label="Kcal"     value={`${macros.calories}`}    color={Colors.primary} />
              <MacroCell label="Proteína" value={`${macros.proteinG}g`}   color="#E74C3C" />
              <MacroCell label="Carbos"   value={`${macros.carbsG}g`}     color={Colors.athlete} />
              <MacroCell label="Grasas"   value={`${macros.fatG}g`}       color={Colors.warning} />
              <MacroCell label="Fibra"    value={`${macros.fiberG}g`}     color="#16A34A" />
            </View>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.recipeDetailIngredients}</Text>
          {currentRecipe.ingredients.length === 0 ? (
            <Text style={styles.emptyText}>{Strings.recipeDetailNoIngredients}</Text>
          ) : (
            currentRecipe.ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{item.food.name}</Text>
                <Text style={styles.ingredientQty}>{item.quantityG}g</Text>
              </View>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.recipeDetailInstructions}</Text>
          <Text style={styles.instructions}>
            {currentRecipe.instructions || Strings.recipeDetailNoInstructions}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── MacroCell ──────────────────────────────────────────────────────────────────

function MacroCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroCell, { borderColor: `${color}30`, backgroundColor: `${color}10` }]}>
      <Text style={[styles.macroCellLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroCellValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  backText: { color: Colors.primary, fontSize: FontSize.md },
  editButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  editButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  image: { width: '100%', height: 220, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },

  title:   { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  tagPill: {
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  tagPillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  section:      { marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  macroCell: {
    flex: 1, minWidth: 60, alignItems: 'center', paddingVertical: Spacing.sm,
    borderWidth: 1, borderRadius: BorderRadius.md,
  },
  macroCellLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  macroCellValue: { fontSize: FontSize.md, fontWeight: '800', marginTop: 2 },

  ingredientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ingredientName: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  ingredientQty:  { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  instructions: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 22 },
  emptyText:    { fontSize: FontSize.sm, color: Colors.textMuted },
  errorText:    { color: Colors.error, fontSize: FontSize.md },
});
