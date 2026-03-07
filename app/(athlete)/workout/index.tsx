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

export default function AthleteWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { routines, isLoading, error, fetchAthleteRoutines, selectRoutine } = useRoutineStore();

  useEffect(() => {
    if (user?.id) fetchAthleteRoutines(user.id);
  }, [user?.id]);

  const handlePress = (routine: Routine) => {
    selectRoutine(routine);
    // Next step: navigate to active workout session
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>My Routines</Text>
            <Text style={styles.subtitle}>Assigned by your coach</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.athlete} size="large" />
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySubtitle}>Your coach hasn't assigned any routines yet</Text>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <RoutineCard routine={item} onPress={handlePress} accentColor={Colors.athlete} />
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startButtonText}>▶  Start Workout</Text>
                </TouchableOpacity>
              </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.athlete, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  list: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  startButton: {
    backgroundColor: Colors.athlete, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md, letterSpacing: 1 },
  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1,
    borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
});
