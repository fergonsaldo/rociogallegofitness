import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Spacing, FontSize } from '@/shared/constants/theme';

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children?: React.ReactNode;
}

/**
 * Shared skeleton wrapper for all screens.
 * Provides safe area, header and a consistent dark background.
 * Each screen will replace this with real content as features are built.
 */
export function ScreenShell({
  title,
  subtitle,
  accentColor = Colors.primary,
  children,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.content}>
          {children ?? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Coming soon</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accent: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    letterSpacing: 2,
  },
});
