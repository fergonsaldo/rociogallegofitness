import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { NutritionPlan } from '../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function CoachNutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { coachPlans, coachPlansLoading, fetchCoachPlans, deletePlan } = useNutritionStore();

  useEffect(() => {
    if (user?.id) fetchCoachPlans(user.id);
  }, [user?.id]);

  const handleDelete = (plan: NutritionPlan) => {
    Alert.alert(Strings.alertDeletePlanTitle, Strings.alertDeletePlanMessage(plan.name), [
      { text: Strings.alertDeleteCancel, style: 'cancel' },
      { text: Strings.alertDeleteConfirm, style: 'destructive', onPress: () => deletePlan(plan.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>Nutrition</Text>
              <Text style={styles.subtitle}>{coachPlans.length} plan{coachPlans.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(coach)/nutrition/create')}
          >
            <Text style={styles.createBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {coachPlansLoading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : coachPlans.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>No nutrition plans yet</Text>
            <Text style={styles.emptySubtitle}>Create personalised plans for your athletes</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(coach)/nutrition/create')}>
              <Text style={styles.emptyBtnText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={coachPlans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.planCard}
                onPress={() => router.push({ pathname: '/(coach)/nutrition/[id]', params: { id: item.id } })}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <View style={styles.planAccentBar} />
                <View style={styles.planContent}>
                  <Text style={styles.planName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.planDesc} numberOfLines={1}>{item.description}</Text>
                  )}
                  <View style={styles.macroRow}>
                    <MacroPill label="Cal" value={`${item.dailyTargetMacros.calories}`} color={Colors.primary} />
                    <MacroPill label="P" value={`${item.dailyTargetMacros.proteinG}g`} color="#E74C3C" />
                    <MacroPill label="C" value={`${item.dailyTargetMacros.carbsG}g`} color={Colors.athlete} />
                    <MacroPill label="F" value={`${item.dailyTargetMacros.fatG}g`} color={Colors.warning} />
                  </View>
                  <Text style={styles.mealCount}>{item.meals.length} meals</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  createBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  list: { gap: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  planCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  planAccentBar: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.primary },
  planContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  planName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  planDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  macroRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  macroPill: {
    flexDirection: 'row', gap: 3, borderWidth: 1,
    borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  macroPillLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  macroPillValue: { fontSize: 9, fontWeight: '600' },
  mealCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  chevron: { fontSize: 22, color: Colors.textMuted, paddingRight: Spacing.md },
});
