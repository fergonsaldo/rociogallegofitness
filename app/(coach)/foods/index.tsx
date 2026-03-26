import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFoodStore } from '../../../src/presentation/stores/foodStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Food, FoodType, FOOD_TYPES } from '../../../src/domain/entities/Food';
import { filterFoods } from '../../../src/application/coach/FoodUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Filter chip config ────────────────────────────────────────────────────────

type FilterKey = FoodType | 'own';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'generic',    label: Strings.foodFilterGeneric },
  { key: 'specific',   label: Strings.foodFilterSpecific },
  { key: 'supplement', label: Strings.foodFilterSupplement },
  { key: 'own',        label: Strings.foodFilterOwn },
];

const TYPE_LABELS: Record<FoodType, string> = {
  generic:    Strings.foodFilterGeneric,
  specific:   Strings.foodFilterSpecific,
  supplement: Strings.foodFilterSupplement,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FoodsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { foods, isLoading, error, fetchFoods, deleteFood } = useFoodStore();

  const [query,        setQuery]        = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchFoods(user.id);
    }, [user?.id]),
  );

  const showOwn = activeFilters.includes('own');
  const activeTypes = activeFilters.filter((f): f is FoodType => f !== 'own');
  const filtered = filterFoods(foods, query, activeTypes, showOwn, user?.id ?? '');

  const toggleFilter = (key: FilterKey) => {
    if (key === 'own') {
      setActiveFilters((prev) =>
        prev.includes('own') ? prev.filter((f) => f !== 'own') : ['own'],
      );
    } else {
      setActiveFilters((prev) =>
        prev.includes('own')
          ? [key]
          : prev.includes(key as FoodType)
            ? prev.filter((f) => f !== key)
            : [...prev.filter((f) => f !== 'own'), key],
      );
    }
  };

  const handleEdit = (food: Food) => {
    router.push({ pathname: '/(coach)/foods/edit' as any, params: { id: food.id } });
  };

  const handleDelete = (food: Food) => {
    Alert.alert(
      Strings.foodDeleteTitle,
      Strings.foodDeleteMessage(food.name),
      [
        { text: Strings.foodDeleteCancel, style: 'cancel' },
        {
          text: Strings.foodDeleteConfirm,
          style: 'destructive',
          onPress: () => deleteFood(food.id),
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
              <Text style={styles.title}>{Strings.foodTitle}</Text>
              <Text style={styles.subtitle}>{Strings.foodSubtitle(foods.length)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(coach)/foods/create' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>{Strings.foodNewButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.foodSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTER_CHIPS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, activeFilters.includes(key) && styles.chipActive]}
              onPress={() => toggleFilter(key)}
            >
              <Text style={[styles.chipText, activeFilters.includes(key) && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.foodEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.foodEmptySubtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <FoodCard
                food={item}
                isOwn={item.coachId === user?.id}
                typeLabel={TYPE_LABELS[item.type]}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── FoodCard ──────────────────────────────────────────────────────────────────

interface FoodCardProps {
  food:       Food;
  isOwn:      boolean;
  typeLabel:  string;
  onEdit:     (f: Food) => void;
  onDelete:   (f: Food) => void;
}

function FoodCard({ food, isOwn, typeLabel, onEdit, onDelete }: FoodCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{food.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
        </View>
        <Text style={styles.per100g}>{Strings.foodPer100g}</Text>
        <View style={styles.macroRow}>
          <MacroPill label="Kcal" value={`${Math.round(food.caloriesPer100g)}`} color={Colors.primary} />
          <MacroPill label="P"    value={`${food.proteinG}g`}                  color="#E74C3C" />
          <MacroPill label="C"    value={`${food.carbsG}g`}                    color={Colors.athlete} />
          <MacroPill label="G"    value={`${food.fatG}g`}                      color={Colors.warning} />
          <MacroPill label="F"    value={`${food.fiberG}g`}                    color="#16A34A" />
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onEdit(food)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity
            onPress={() => onDelete(food)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroPill, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
      <Text style={[styles.macroPillLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroPillValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardAccent:  { width: 4, backgroundColor: Colors.primary },
  cardContent: { flex: 1, padding: Spacing.md, gap: 4 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardName:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  per100g:     { fontSize: FontSize.xs, color: Colors.textMuted },
  macroRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  typeBadge: {
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  typeBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  macroPill: {
    flexDirection: 'row', gap: 3, borderWidth: 1,
    borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  macroPillLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  macroPillValue: { fontSize: 9, fontWeight: '600' },

  cardActions: { justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md },
  editIcon:    { fontSize: 16 },
  deleteIcon:  { fontSize: 16 },
});
