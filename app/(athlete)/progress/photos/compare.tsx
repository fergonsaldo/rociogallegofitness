import {
  View, Text, TouchableOpacity, FlatList,
  Image, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useProgressPhotoStore } from '../../../../src/presentation/stores/progressPhotoStore';
import { PhotoComparator } from '../../../../src/presentation/components/athlete/PhotoComparator';
import { ProgressPhoto, PHOTO_TAG_LABELS } from '../../../../src/domain/entities/ProgressPhoto';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/shared/constants/theme';
import { Strings } from '../../../../src/shared/constants/strings';

type Step = 'select-before' | 'select-after' | 'compare';

export default function PhotoCompareScreen() {
  const router         = useRouter();
  const { photos }     = useProgressPhotoStore();

  const [step,   setStep]   = useState<Step>('select-before');
  const [before, setBefore] = useState<ProgressPhoto | null>(null);
  const [after,  setAfter]  = useState<ProgressPhoto | null>(null);

  const handleSelectBefore = (photo: ProgressPhoto) => {
    setBefore(photo);
    setStep('select-after');
  };

  const handleSelectAfter = (photo: ProgressPhoto) => {
    setAfter(photo);
    setStep('compare');
  };

  const stepTitle = step === 'select-before'
    ? Strings.progressPhotoSelectBefore
    : step === 'select-after'
    ? Strings.progressPhotoSelectAfter
    : Strings.progressPhotoComparing;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (step === 'select-before') router.back();
          else if (step === 'select-after') { setBefore(null); setStep('select-before'); }
          else { setAfter(null); setStep('select-after'); }
        }}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{stepTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Steps indicator */}
      <View style={styles.stepsRow}>
        {(['select-before', 'select-after', 'compare'] as Step[]).map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step === s && styles.stepDotActive,
              (step === 'select-after' && i === 0) || step === 'compare' ? styles.stepDotDone : null]}>
              <Text style={styles.stepDotText}>{i + 1}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Photo selector */}
      {(step === 'select-before' || step === 'select-after') && (
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => {
            const isDisabled = step === 'select-after' && item.id === before?.id;
            return (
              <TouchableOpacity
                style={[styles.photoCard, isDisabled && styles.photoCardDisabled]}
                onPress={() => {
                  if (isDisabled) return;
                  if (step === 'select-before') handleSelectBefore(item);
                  else handleSelectAfter(item);
                }}
                activeOpacity={isDisabled ? 1 : 0.8}
              >
                <Image source={{ uri: item.publicUrl }} style={styles.photo} resizeMode="cover" />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoTag}>{PHOTO_TAG_LABELS[item.tag]}</Text>
                  <Text style={styles.photoDate}>
                    {item.takenAt.toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Comparador */}
      {step === 'compare' && before && after && (
        <ScrollView contentContainerStyle={styles.compareContent} showsVerticalScrollIndicator={false}>
          <PhotoComparator before={before} after={after} />
          <TouchableOpacity style={styles.resetButton} onPress={() => { setBefore(null); setAfter(null); setStep('select-before'); }}>
            <Text style={styles.resetButtonText}>Comparar otras fotos</Text>
          </TouchableOpacity>
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 60 },
  title:   { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  stepsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stepItem: { alignItems: 'center' },
  stepDot:  { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceMuted, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: Colors.athlete, backgroundColor: Colors.athleteSubtle },
  stepDotDone:   { borderColor: Colors.success, backgroundColor: `${Colors.success}20` },
  stepDotText:   { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  grid:    { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  gridRow: { gap: Spacing.sm },
  photoCard: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden', aspectRatio: 0.75, backgroundColor: Colors.surfaceMuted },
  photoCardDisabled: { opacity: 0.3 },
  photo:       { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.xs, gap: 1 },
  photoTag:    { fontSize: 11, fontWeight: '700', color: '#fff' },
  photoDate:   { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  compareContent: { padding: Spacing.lg, gap: Spacing.lg },
  resetButton: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  resetButtonText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
});
