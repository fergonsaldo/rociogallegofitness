import { View, Image, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { useRef, useState } from 'react';
import { ProgressPhoto, PHOTO_TAG_LABELS } from '@/domain/entities/ProgressPhoto';
import { Colors, FontSize, Spacing, BorderRadius } from '@/shared/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH  = SCREEN_WIDTH - Spacing.lg * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.25; // portrait ratio

interface PhotoComparatorProps {
  before: ProgressPhoto;
  after:  ProgressPhoto;
}

export function PhotoComparator({ before, after }: PhotoComparatorProps) {
  const [sliderX, setSliderX] = useState(IMAGE_WIDTH / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gesture) => {
        const newX = Math.max(0, Math.min(IMAGE_WIDTH, gesture.moveX - Spacing.lg));
        setSliderX(newX);
      },
    }),
  ).current;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Labels */}
      <View style={styles.labelsRow}>
        <View style={styles.labelBefore}>
          <Text style={styles.labelText}>ANTES</Text>
          <Text style={styles.labelDate}>{fmtDate(before.takenAt)}</Text>
          <Text style={styles.labelTag}>{PHOTO_TAG_LABELS[before.tag]}</Text>
        </View>
        <View style={styles.labelAfter}>
          <Text style={styles.labelText}>DESPUÉS</Text>
          <Text style={styles.labelDate}>{fmtDate(after.takenAt)}</Text>
          <Text style={styles.labelTag}>{PHOTO_TAG_LABELS[after.tag]}</Text>
        </View>
      </View>

      {/* Comparator frame */}
      <View style={[styles.frame, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
        {/* After photo — full width underneath */}
        <Image
          source={{ uri: after.signedUrl }}
          style={[styles.photo, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}
          resizeMode="cover"
        />

        {/* Before photo — clipped to sliderX */}
        <View style={[styles.beforeClip, { width: sliderX }]}>
          <Image
            source={{ uri: before.signedUrl }}
            style={[styles.photo, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}
            resizeMode="cover"
          />
        </View>

        {/* Slider handle */}
        <View
          style={[styles.sliderLine, { left: sliderX - 1 }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderHandle}>
            <Text style={styles.sliderIcon}>◀▶</Text>
          </View>
        </View>
      </View>

      <Text style={styles.hint}>Arrastra para comparar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  labelBefore: { alignItems: 'flex-start' },
  labelAfter:  { alignItems: 'flex-end' },
  labelText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 1.5 },
  labelDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  labelTag:  { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  frame: { borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  photo: { position: 'absolute', top: 0, left: 0 },
  beforeClip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },

  sliderLine: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  sliderHandle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
  sliderIcon: { fontSize: 12, color: Colors.textSecondary },

  hint: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
});
