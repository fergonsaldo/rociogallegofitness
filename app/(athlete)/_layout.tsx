import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '../../src/shared/constants/theme';
import { Strings } from '../../src/shared/constants/strings';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { useWorkoutStore } from '../../src/presentation/stores/workoutStore';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function AthleteLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  const { user } = useAuthStore();
  const { restoreActiveSession } = useWorkoutStore();

  useEffect(() => {
    if (user?.id) {
      restoreActiveSession(user.id);
    }
  }, [user?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.athlete,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      {/* ── Tabs visibles ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label={Strings.tabHome} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💪" label={Strings.tabTrain} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label={Strings.tabExercises} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📈" label={Strings.tabProgress} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🥗" label={Strings.tabNutrition} focused={focused} />
          ),
        }}
      />

      {/* ── Rutas sin tab (ocultas de la barra) ── */}
      <Tabs.Screen name="workout/session"   options={{ href: null }} />
      <Tabs.Screen name="progress/exercise" options={{ href: null }} />
      <Tabs.Screen name="progress/session"  options={{ href: null }} />
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
  tabLabelActive: { color: Colors.athlete, fontWeight: '600' },
});
