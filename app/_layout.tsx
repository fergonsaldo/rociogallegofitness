import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/presentation/stores/authStore';
import { useSessionListener } from '../src/presentation/hooks/useSessionListener';
import { runMigrations } from '../src/infrastructure/database/client';
import { Colors } from '../src/shared/constants/theme';
import '../global.css';

export default function RootLayout() {
  const { status, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [dbReady, setDbReady] = useState(false);
  useEffect(() => {
    runMigrations()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[RootLayout] SQLite migrations failed:', err);
        setDbReady(true);
      });
  }, []);

  useSessionListener();

  useEffect(() => {
    if (!dbReady || status === 'idle' || status === 'loading') return;

    const inAuth = segments[0] === '(auth)';
    const inCoach = segments[0] === '(coach)';
    const inAthlete = segments[0] === '(athlete)';

    if (status === 'unauthenticated') {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && user) {
      if (user.role === 'coach' && !inCoach) {
        router.replace('/(coach)/dashboard');
      } else if (user.role === 'athlete' && !inAthlete) {
        router.replace('/(athlete)/dashboard');
      }
    }
  }, [status, user, segments, dbReady]);

  if (!dbReady || status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(coach)" />
      <Stack.Screen name="(athlete)" />
    </Stack>
  );
}
