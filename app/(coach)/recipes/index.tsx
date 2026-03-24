import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Recipe } from '../../../src/domain/entities/Recipe';
import { filterRecipes } from '../../../src/application/coach/RecipeUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function RecipesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { recipes, isLoading, error, fetchRecipes, deleteRecipe } = useRecipeStore();

  const [query,      setQuery]      = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchRecipes(user.id);
    }, [user?.id]),
  );

  const allTags = [...new Set(recipes.flatMap((r) => r.tags))].sort();
  const filtered = filterRecipes(recipes, query, activeTags);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const handleDelete = (recipe: Recipe) => {
    Alert.alert(
      Strings.recipeDeleteTitle,
      Strings.recipeDeleteMessage(recipe.name),
      [
        { text: Strings.recipeDeleteCancel, style: 'cancel' },
        {
          text: Strings.recipeDeleteConfirm,
          style: 'destructive',
          onPress: () => deleteRecipe(recipe.id, recipe.imagePath),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>{Strings.recipeTitle}</Text>
              <Text style={styles.subtitle}>{Strings.recipeSubtitle(recipes.length)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(coach)/recipes/create' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>{Strings.recipeNewButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.recipeSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Tag chips */}
        {allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsRow}
            contentContainerStyle={styles.chipsContent}
          >
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, activeTags.includes(tag) && styles.chipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.chipText, activeTags.includes(tag) && styles.chipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        ) : recipes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🍽</Text>
            <Text style={styles.emptyTitle}>{Strings.recipeEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.recipeEmptySubtitle}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(coach)/recipes/create' as any)}
            >
              <Text style={styles.emptyButtonText}>{Strings.recipeEmptyButton}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.recipeEmptySearch}</Text>
            <Text style={styles.emptySubtitle}>{Strings.recipeEmptySearchSubtitle(query)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                onPress={() => router.push({ pathname: '/(coach)/recipes/[id]', params: { id: item.id } } as any)}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── RecipeCard ─────────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe:   Recipe;
  onPress:  () => void;
  onDelete: (r: Recipe) => void;
}

function RecipeCard({ recipe, onPress, onDelete }: RecipeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{recipe.name}</Text>
        </View>
        {recipe.tags.length > 0 && (
          <View style={styles.tagRow}>
            {recipe.tags.slice(0, 4).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagPillText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(recipe)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  searchInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },

  chipsRow:     { flexGrow: 0, marginBottom: Spacing.xs },
  chipsContent: { gap: Spacing.xs, paddingRight: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardAccent:  { width: 4, backgroundColor: Colors.primary },
  cardContent: { flex: 1, padding: Spacing.md, gap: 6 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center' },
  cardName:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tagPill: {
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  tagPillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  deleteButton: { justifyContent: 'center', paddingHorizontal: Spacing.md },
  deleteIcon:   { fontSize: 18 },
});
