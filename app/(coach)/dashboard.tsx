import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { ScreenShell } from '../../src/presentation/components/common/ScreenShell';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/shared/constants/theme';

export default function CoachDashboardScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={`Welcome back, ${user?.fullName ?? 'Coach'}`}
      accentColor={Colors.primary}
    >
      {/* Summary cards — placeholder until data layer is wired */}
      <View style={styles.cardRow}>
        {[
          { label: 'Clients', value: '—', emoji: '👥' },
          { label: 'Routines', value: '—', emoji: '📋' },
        ].map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Client activity feed coming in step 5 →
        </Text>
      </View>

      {/* Temp logout button for testing */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardEmoji: { fontSize: 28 },
  cardValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    textAlign: 'center',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
});
