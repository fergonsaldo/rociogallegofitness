import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoStore } from '../../../src/presentation/stores/videoStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Video } from '../../../src/domain/entities/Video';
import { filterVideos } from '../../../src/application/coach/VideoUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Component ──────────────────────────────────────────────────────────────────

export default function CoachVideosScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { catalog, isLoading, error, fetchAll, delete: deleteVideo } = useVideoStore();

  const [query, setQuery]           = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchAll(user.id);
    }, [user?.id]),
  );

  const availableTags = [...new Set(catalog.flatMap((v) => v.tags))].sort();
  const filtered = filterVideos(catalog, query, activeTags);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const handleDelete = (video: Video) => {
    Alert.alert(
      Strings.videoDeleteConfirmTitle,
      Strings.videoDeleteConfirmMessage(video.title),
      [
        { text: Strings.videoDeleteCancel, style: 'cancel' },
        { text: Strings.videoDeleteConfirm, style: 'destructive', onPress: () => deleteVideo(video.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>{Strings.videoTitle}</Text>
              <Text style={styles.subtitle}>{Strings.videoSubtitle(catalog.length)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(coach)/videos/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>{Strings.videoNewButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.videoSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Tag chips (derived from catalog) */}
        {availableTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsRow}
            contentContainerStyle={styles.chipsContent}
          >
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, activeTags.includes(tag) && styles.chipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.chipText, activeTags.includes(tag) && styles.chipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : catalog.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🎬</Text>
            <Text style={styles.emptyTitle}>{Strings.videoEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.videoEmptySubtitle}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(coach)/videos/create')}
            >
              <Text style={styles.emptyButtonText}>{Strings.videoEmptyButton}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.videoEmptySearch}</Text>
            <Text style={styles.emptySubtitle}>{Strings.videoEmptySearchSubtitle(query)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VideoCard video={item} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── VideoCard ──────────────────────────────────────────────────────────────────

interface VideoCardProps {
  video:    Video;
  onDelete: (v: Video) => void;
}

function VideoCard({ video, onDelete }: VideoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{video.title}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(video)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardUrl} numberOfLines={1}>{video.url}</Text>
        {video.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{video.description}</Text>
        ) : null}
        {video.tags.length > 0 && (
          <View style={styles.tagRow}>
            {video.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  searchInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },

  chipsRow:     { flexGrow: 0, marginBottom: Spacing.xs },
  chipsContent: { gap: Spacing.xs, paddingRight: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardAccent:      { width: 4, backgroundColor: Colors.primary },
  cardContent:     { flex: 1, padding: Spacing.md, gap: 4 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle:       { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardUrl:         { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardDescription: { fontSize: FontSize.xs, color: Colors.textMuted },
  deleteButton:    { justifyContent: 'center', paddingLeft: Spacing.sm },
  deleteIcon:      { fontSize: 18 },

  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 2 },
  tagChip:      { backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  tagChipText:  { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
});
