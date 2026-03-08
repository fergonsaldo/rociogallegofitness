import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Colors, FontSize, Spacing, BorderRadius } from '@/shared/constants/theme';

/**
 * Displays a countdown timer between sets.
 * Subscribes to workoutStore.restTimerSeconds and ticks every second.
 * Auto-hides when the timer reaches zero.
 */
export function RestTimer() {
  const { restTimerSeconds, restTimerActive, stopRestTimer, tickRestTimer } = useWorkoutStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (restTimerActive) {
      intervalRef.current = setInterval(tickRestTimer, 1000);

      // Subtle pulse animation on the timer
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulse.stopAnimation();
      pulse.setValue(1);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restTimerActive]);

  if (!restTimerActive) return null;

  const mins = Math.floor(restTimerSeconds / 60);
  const secs = restTimerSeconds % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.label}>REST</Text>
        <Animated.Text style={[styles.timer, { transform: [{ scale: pulse }] }]}>
          {display}
        </Animated.Text>
        <TouchableOpacity style={styles.skipButton} onPress={stopRestTimer}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  banner: {
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timer: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  skipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
  },
});
