import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '../../src/shared/constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function CoachLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      {/* ── Tabs visibles ── */}
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Inicio" focused={focused} /> }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Clientes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="routines/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Rutinas" focused={focused} /> }}
      />
      <Tabs.Screen
        name="exercises/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏋️" label="Ejercicios" focused={focused} /> }}
      />
      <Tabs.Screen
        name="nutrition/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🥗" label="Nutrición" focused={focused} /> }}
      />

      {/* ── Rutas sin tab (ocultas de la barra) ── */}
      <Tabs.Screen name="clients/[id]"      options={{ href: null }} />
      <Tabs.Screen name="routines/[id]"     options={{ href: null }} />
      <Tabs.Screen name="routines/create"   options={{ href: null }} />
      <Tabs.Screen name="exercises/create"  options={{ href: null }} />
      <Tabs.Screen name="exercises/[id]"    options={{ href: null }} />
      <Tabs.Screen name="nutrition/[id]"    options={{ href: null }} />
      <Tabs.Screen name="nutrition/create"  options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIcon: { alignItems: 'center', gap: 2, paddingTop: 6 },
  tabEmoji: { fontSize: 22 },
  tabLabel: { fontSize: FontSize.xs, color: Colors.tabInactive, letterSpacing: 0.5 },
  tabLabelActive: { color: Colors.primary, fontWeight: '600' },
});
