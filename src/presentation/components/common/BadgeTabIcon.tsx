import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/shared/constants/theme';

interface BadgeTabIconProps {
  emoji:      string;
  label:      string;
  focused:    boolean;
  badge?:     number;
  accentColor?: string;
}

export function BadgeTabIcon({ emoji, label, focused, badge, accentColor }: BadgeTabIconProps) {
  const accent = accentColor ?? Colors.primary;
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Text style={styles.emoji}>{emoji}</Text>
        {!!badge && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && { color: accent, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { alignItems: 'center', gap: 2, paddingTop: 6 },
  iconWrapper: { position: 'relative' },
  emoji:       { fontSize: 22 },
  label:       { fontSize: FontSize.xs, color: Colors.tabInactive, letterSpacing: 0.5 },
  badge:       {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
