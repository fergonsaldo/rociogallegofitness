import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useProgressStore } from '../../../src/presentation/stores/progressStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { WorkoutHistoryCard } from '../../../src/presentation/components/athlete/WorkoutHistoryCard';
import { WorkoutHistoryEntry } from '../../../src/application/athlete/ProgressUseCases';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

type Tab = 'history' | 'bests';

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    history, historyLoading,
    personalBests, personalBestsLoading,
    fetchHistory, fetchPersonalBests,
  } = useProgressStore();

  const [activeTab, setActiveTab] = useState<Tab>('history');

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      fetchHistory(user.id);
      fetchPersonalBests(user.id);
    }, [user?.id]),
  );
  const isLoading = historyLoading || personalBestsLoading;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>Progreso</Text>
            <Text style={styles.subtitle}>Sigue tu evolución</Text>
          </View>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['history', 'bests'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'history' ? Strings.tabHistory : Strings.tabPersonalBests}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.athlete} size="large" />
        </View>
      )}

      {/* History tab */}
      {!isLoading && activeTab === 'history' && (
        history.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Sin entrenamientos aún</Text>
            <Text style={styles.emptySubtitle}>Completa tu primera sesión para verla aquí</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.session.id}
            renderItem={({ item }) => (
              <WorkoutHistoryCard
                entry={item}
                onPress={(entry: WorkoutHistoryEntry) =>
                  router.push({ pathname: '/(athlete)/progress/session', params: { sessionId: entry.session.id } })
                }
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* Personal bests tab */}
      {!isLoading && activeTab === 'bests' && (
        personalBests.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>Sin récords aún</Text>
            <Text style={styles.emptySubtitle}>Termina un entrenamiento para registrar tu primer récord</Text>
          </View>
        ) : (
          <FlatList
            data={personalBests}
            keyExtractor={(item) => item.exerciseId}
            renderItem={({ item }) => {
              const exercise = findExerciseById(item.exerciseId);
              return (
                <TouchableOpacity
                  style={styles.prCard}
                  onPress={() => router.push({
                    pathname: '/(athlete)/progress/exercise',
                    params: { exerciseId: item.exerciseId },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.prLeft}>
                    <Text style={styles.prName}>{exercise?.name ?? Strings.fallbackUnknown}</Text>
                    <Text style={styles.prDate}>
                      {item.achievedAt.toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.prRight}>
                    {item.estimatedOneRepMaxKg && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeLabel}>1RM EST.</Text>
                        <Text style={styles.prBadgeValue}>{item.estimatedOneRepMaxKg} kg</Text>
                      </View>
                    )}
                    {item.bestWeightKg && !item.estimatedOneRepMaxKg && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeLabel}>MEJOR</Text>
                        <Text style={styles.prBadgeValue}>{item.bestWeightKg} kg</Text>
                      </View>
                    )}
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.athlete, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  tab: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
    alignItems: 'center', backgroundColor: Colors.surface,
  },
  tabActive: { borderColor: Colors.athlete, backgroundColor: Colors.athleteSubtle },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.athlete },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  prCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  prLeft: { flex: 1 },
  prName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  prDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  prRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  prBadge: {
    alignItems: 'center', backgroundColor: Colors.primarySubtle,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  prBadgeLabel: { fontSize: 9, color: Colors.primary, letterSpacing: 1.5, fontWeight: '700' },
  prBadgeValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  chevron: { fontSize: 22, color: Colors.textMuted },
});
