import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useProgressStore } from '../../../src/presentation/stores/progressStore';
import { useBodyMetricStore } from '../../../src/presentation/stores/bodyMetricStore';
import { useProgressPhotoStore } from '../../../src/presentation/stores/progressPhotoStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { WorkoutHistoryCard } from '../../../src/presentation/components/athlete/WorkoutHistoryCard';
import { ConsistencyChart } from '../../../src/presentation/components/athlete/ConsistencyChart';
import { WorkoutHistoryEntry } from '../../../src/application/athlete/ProgressUseCases';
import { useExerciseResolver } from '../../../src/presentation/hooks/useExerciseResolver';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

type Tab = 'history' | 'bests' | 'body' | 'photos';

const TABS: { key: Tab; label: string }[] = [
  { key: 'history', label: '📋 Historial' },
  { key: 'bests',   label: '🏆 Récords'   },
  { key: 'body',    label: '📏 Cuerpo'    },
  { key: 'photos',  label: '📸 Fotos'     },
];

export default function ProgressScreen() {
  const router          = useRouter();
  const { user }        = useAuthStore();
  const resolveExercise = useExerciseResolver();

  const {
    history, historyLoading,
    personalBests, personalBestsLoading,
    fetchHistory, fetchPersonalBests,
  } = useProgressStore();

  const { metrics, summary, isLoading: metricsLoading, fetch: fetchMetrics } = useBodyMetricStore();
  const { photos, isLoading: photosLoading, fetch: fetchPhotos }             = useProgressPhotoStore();

  const [activeTab, setActiveTab] = useState<Tab>('history');

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      fetchHistory(user.id);
      fetchPersonalBests(user.id);
      fetchMetrics(user.id);
      fetchPhotos(user.id);
    }, [user?.id]),
  );

  const isLoading = historyLoading || personalBestsLoading || metricsLoading || photosLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>Progreso</Text>
            <Text style={styles.subtitle}>Sigue tu evolución</Text>
          </View>
        </View>
      </View>

      {/* Tabs — scroll horizontal para los 4 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.athlete} size="large" />
        </View>
      )}

      {/* ── Historial ── */}
      {!isLoading && activeTab === 'history' && (
        history.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Sin entrenamientos aún</Text>
            <Text style={styles.emptySubtitle}>Completa tu primera sesión para verla aquí</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
              <ConsistencyChart history={history} />
            </View>
            <FlatList
              data={history}
              keyExtractor={(item) => item.session.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <WorkoutHistoryCard
                  entry={item}
                  onPress={(entry: WorkoutHistoryEntry) =>
                    router.push({ pathname: '/(athlete)/progress/session', params: { sessionId: entry.session.id } })
                  }
                />
              )}
              contentContainerStyle={styles.list}
            />
          </ScrollView>
        )
      )}

      {/* ── Récords ── */}
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
              const exercise = resolveExercise(item.exerciseId);
              return (
                <TouchableOpacity
                  style={styles.prCard}
                  onPress={() => router.push({ pathname: '/(athlete)/progress/exercise', params: { exerciseId: item.exerciseId } })}
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

      {/* ── Cuerpo ── */}
      {!isLoading && activeTab === 'body' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(athlete)/progress/body-metric')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>{Strings.bodyMetricsAdd}</Text>
          </TouchableOpacity>

          {metrics.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>📏</Text>
              <Text style={styles.emptyTitle}>{Strings.bodyMetricsEmpty}</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {([
                  { key: 'weightKg'       as const, label: Strings.bodyMetricWeight, unit: Strings.bodyMetricUnitKg },
                  { key: 'waistCm'        as const, label: Strings.bodyMetricWaist,  unit: Strings.bodyMetricUnitCm },
                  { key: 'hipCm'          as const, label: Strings.bodyMetricHip,    unit: Strings.bodyMetricUnitCm },
                  { key: 'bodyFatPercent' as const, label: Strings.bodyMetricFat,    unit: Strings.bodyMetricUnitPercent },
                ]).map(({ key, label, unit }) => {
                  const val   = summary.latest?.[key];
                  const delta = summary.delta[key];
                  if (val === undefined) return null;
                  const positive = (delta ?? 0) > 0;
                  return (
                    <View key={key} style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>{label}</Text>
                      <Text style={styles.summaryValue}>
                        {val}<Text style={styles.summaryUnit}> {unit}</Text>
                      </Text>
                      {delta !== null && (
                        <Text style={[styles.summaryDelta, positive ? styles.deltaUp : styles.deltaDown]}>
                          {positive ? '+' : ''}{delta} {unit}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.chartsLink}
                onPress={() => router.push('/(athlete)/progress/body-charts')}
                activeOpacity={0.8}
              >
                <Text style={styles.chartsLinkText}>Ver gráficos de evolución →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Fotos ── */}
      {!isLoading && activeTab === 'photos' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.photosContent}>
          <View style={styles.photosActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(athlete)/progress/photos/add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>{Strings.progressPhotosAdd}</Text>
            </TouchableOpacity>
            {photos.length >= 2 && (
              <TouchableOpacity
                style={styles.compareButton}
                onPress={() => router.push('/(athlete)/progress/photos/compare')}
                activeOpacity={0.8}
              >
                <Text style={styles.compareButtonText}>{Strings.progressPhotoCompare}</Text>
              </TouchableOpacity>
            )}
          </View>

          {photos.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>{Strings.progressPhotosEmpty}</Text>
            </View>
          ) : (
            <>
              <View style={styles.photoGrid}>
                {photos.slice(-6).reverse().map((photo) => (
                  <View key={photo.id} style={styles.photoThumb}>
                    <View style={styles.photoThumbOverlay}>
                      <Text style={styles.photoThumbDate}>
                        {photo.takenAt.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => router.push('/(athlete)/progress/photos/timeline')}>
                <Text style={styles.viewTimeline}>Ver timeline completo →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.athlete, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabScroll:  { flexGrow: 0 },
  tabRow:     { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  tab:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface },
  tabActive:  { borderColor: Colors.athlete, backgroundColor: Colors.athleteSubtle },
  tabText:    { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.athlete },
  list:       { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  prCard:     { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  prLeft:     { flex: 1 },
  prName:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  prDate:     { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  prRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  prBadge:    { alignItems: 'center', backgroundColor: Colors.primarySubtle, borderWidth: 1, borderColor: `${Colors.primary}30`, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  prBadgeLabel: { fontSize: 9, color: Colors.primary, letterSpacing: 1.5, fontWeight: '700' },
  prBadgeValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  chevron:    { fontSize: 22, color: Colors.textMuted },
  bodyContent:  { padding: Spacing.lg, gap: Spacing.lg },
  summaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  summaryCard:  { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 2 },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  summaryUnit:  { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '400' },
  summaryDelta: { fontSize: FontSize.xs, fontWeight: '700' },
  deltaUp:      { color: Colors.error },
  deltaDown:    { color: Colors.success },
  chartsLink:     { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: `${Colors.primary}30`, padding: Spacing.md, alignItems: 'center' },
  chartsLinkText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  addButton:      { backgroundColor: Colors.athlete, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  addButtonText:  { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  photosContent:  { padding: Spacing.lg, gap: Spacing.lg },
  photosActions:  { gap: Spacing.sm },
  compareButton:  { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  compareButtonText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  photoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumb:     { width: '31%', aspectRatio: 0.8, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', justifyContent: 'flex-end' },
  photoThumbOverlay: { padding: Spacing.xs, backgroundColor: 'rgba(0,0,0,0.3)' },
  photoThumbDate:    { fontSize: 10, color: '#fff', textAlign: 'center' },
  viewTimeline:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700', textAlign: 'center' },
});
