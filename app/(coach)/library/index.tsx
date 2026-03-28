import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Datos de las tarjetas ──────────────────────────────────────────────────────

export const LIBRARY_CARDS = [
  {
    emoji:    '📋',
    title:    Strings.libraryCardRoutinesTitle,
    subtitle: Strings.libraryCardRoutinesSubtitle,
    route:    '/(coach)/routines' as const,
  },
  {
    emoji:    '🏋️',
    title:    Strings.libraryCardExercisesTitle,
    subtitle: Strings.libraryCardExercisesSubtitle,
    route:    '/(coach)/exercises' as const,
  },
  {
    emoji:    '🏃',
    title:    Strings.libraryCardCardioTitle,
    subtitle: Strings.libraryCardCardioSubtitle,
    route:    '/(coach)/cardios' as const,
  },
  {
    emoji:    '🎬',
    title:    Strings.libraryCardVideosTitle,
    subtitle: Strings.libraryCardVideosSubtitle,
    route:    '/(coach)/videos' as const,
  },
  {
    emoji:    '🥗',
    title:    Strings.libraryCardNutritionTitle,
    subtitle: Strings.libraryCardNutritionSubtitle,
    route:    '/(coach)/nutrition' as const,
  },
] as const;

// ── Componente tarjeta ─────────────────────────────────────────────────────────

function LibraryCard({
  emoji,
  title,
  subtitle,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.libraryTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {LIBRARY_CARDS.map((card) => (
          <LibraryCard
            key={card.route}
            emoji={card.emoji}
            title={card.title}
            subtitle={card.subtitle}
            onPress={() => router.push(card.route)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardChevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '300',
  },
});
