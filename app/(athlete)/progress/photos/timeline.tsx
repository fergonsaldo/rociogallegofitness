import {
  View, Text, Image, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgressPhotoStore } from '../../../../src/presentation/stores/progressPhotoStore';
import { useAuthStore } from '../../../../src/presentation/stores/authStore';
import { ProgressPhoto, PHOTO_TAG_LABELS } from '../../../../src/domain/entities/ProgressPhoto';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/shared/constants/theme';
import { Strings } from '../../../../src/shared/constants/strings';

const THUMB_SIZE = (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.sm) / 2;

export default function PhotoTimelineScreen() {
  const router                              = useRouter();
  const { user }                            = useAuthStore();
  const { photos, delete: deletePhoto }     = useProgressPhotoStore();

  const handleDelete = (photo: ProgressPhoto) => {
    Alert.alert(
      Strings.progressPhotoDelete,
      '¿Eliminar esta foto? No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deletePhoto(photo) },
      ],
    );
  };

  // Group photos by month
  const grouped = photos.reduce<Record<string, ProgressPhoto[]>>((acc, photo) => {
    const key = photo.takenAt.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    acc[key] = [...(acc[key] ?? []), photo];
    return acc;
  }, {});

  const sections = Object.entries(grouped).reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{Strings.progressPhotosTitle}</Text>
        <TouchableOpacity onPress={() => router.push('/(athlete)/progress/photos/add')}>
          <Text style={styles.addLink}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={([month]) => month}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: [month, monthPhotos] }) => (
          <View style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.toUpperCase()}</Text>
            <View style={styles.photoGrid}>
              {monthPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  onLongPress={() => handleDelete(photo)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: photo.publicUrl }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoTag}>{PHOTO_TAG_LABELS[photo.tag]}</Text>
                    <Text style={styles.photoDate}>
                      {photo.takenAt.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>{Strings.progressPhotosEmpty}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 60 },
  title:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  addLink: { fontSize: FontSize.sm, color: Colors.athlete, fontWeight: '700', width: 60, textAlign: 'right' },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  monthSection: { gap: Spacing.sm },
  monthTitle:   { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 2 },
  photoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoCard:    { width: THUMB_SIZE, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  photo:        { width: THUMB_SIZE, height: THUMB_SIZE * 1.3 },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.xs, gap: 1 },
  photoTag:     { fontSize: 11, fontWeight: '700', color: '#fff' },
  photoDate:    { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xxl },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
