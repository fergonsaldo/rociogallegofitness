import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '../../src/shared/constants/theme';
import { Strings } from '../../src/shared/constants/strings';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { useMessageStore } from '../../src/presentation/stores/messageStore';
import { BadgeTabIcon } from '../../src/presentation/components/common/BadgeTabIcon';

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

  const { user }                           = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useMessageStore();

  useEffect(() => {
    if (user?.id) {
      refreshUnreadCount(user.id);
      const interval = setInterval(() => refreshUnreadCount(user.id!), 15000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

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
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Inicio" focused={focused} /> }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Clientes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="library/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" label={Strings.tabLibrary} focused={focused} /> }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label={Strings.tabAgenda} focused={focused} /> }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <BadgeTabIcon
              emoji="💬"
              label={Strings.tabMessages}
              focused={focused}
              badge={unreadCount}
              accentColor={Colors.primary}
            />
          ),
        }}
      />

      {/* Rutas sin tab */}
      <Tabs.Screen name="clients/[id]"      options={{ href: null }} />
      <Tabs.Screen name="routines/index"    options={{ href: null }} />
      <Tabs.Screen name="routines/[id]"     options={{ href: null }} />
      <Tabs.Screen name="routines/create"   options={{ href: null }} />
      <Tabs.Screen name="exercises/index"   options={{ href: null }} />
      <Tabs.Screen name="exercises/create"  options={{ href: null }} />
      <Tabs.Screen name="exercises/[id]"    options={{ href: null }} />
      <Tabs.Screen name="cardios/index"     options={{ href: null }} />
      <Tabs.Screen name="cardios/create"    options={{ href: null }} />
      <Tabs.Screen name="videos/index"      options={{ href: null }} />
      <Tabs.Screen name="videos/create"     options={{ href: null }} />
      <Tabs.Screen name="nutrition/index"   options={{ href: null }} />
      <Tabs.Screen name="nutrition/[id]"    options={{ href: null }} />
      <Tabs.Screen name="nutrition/create"  options={{ href: null }} />
      <Tabs.Screen name="messages/[id]"     options={{ href: null }} />
      <Tabs.Screen name="clients/tags"      options={{ href: null }} />
      <Tabs.Screen name="calendar/create"   options={{ href: null }} />
      <Tabs.Screen name="calendar/edit"     options={{ href: null }} />
      <Tabs.Screen name="foods"                          options={{ href: null }} />
      <Tabs.Screen name="recipes"                        options={{ href: null }} />
      <Tabs.Screen name="clients/documents"              options={{ href: null }} />
      <Tabs.Screen name="nutrition/groups/index"         options={{ href: null }} />
      <Tabs.Screen name="nutrition/groups/[id]"          options={{ href: null }} />
      <Tabs.Screen name="session-types/index"            options={{ href: null }} />
      <Tabs.Screen name="schedules/index"               options={{ href: null }} />
      <Tabs.Screen name="schedules/create"              options={{ href: null }} />
      <Tabs.Screen name="session-activity/index"        options={{ href: null }} />
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
  tabIcon:        { alignItems: 'center', gap: 2, paddingTop: 6 },
  tabEmoji:       { fontSize: 22 },
  tabLabel:       { fontSize: FontSize.xs, color: Colors.tabInactive, letterSpacing: 0.5 },
  tabLabelActive: { color: Colors.primary, fontWeight: '600' },
});
