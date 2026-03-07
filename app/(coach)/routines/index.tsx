import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { RoutineCard } from '../../../src/presentation/components/common/RoutineCard';
import { Routine } from '../../../src/domain/entities/Routine';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

export default function CoachRoutinesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { routines, isLoading, error, fetchCoachRoutines, selectRoutine } = useRoutineStore();

  useEffect(() => {
    if (user?.id) fetchCoachRoutines(user.id);
  }, [user?.id]);

  const handlePress = (routine: Routine) => {
    selectRoutine(routine);
    router.push(`/(coach)/routines/${routine.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>Routines</Text>
              <Text style={styles.subtitle}>{routines.length} program{routines.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(coach)/routines/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySubtitle}>Create your first training program</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(coach)/routines/create')}
            >
              <Text style={styles.emptyButtonText}>Create Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoutineCard routine={item} onPress={handlePress} accentColor={Colors.primary} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  list: { gap: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1,
    borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
});
