import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { useState } from 'react';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';
import { Strings } from '@/shared/constants/strings';
import { extractYouTubeVideoId } from '@/shared/utils/youtube';

interface ExerciseVideoPlayerProps {
  videoUrl: string;
  exerciseName: string;
  visible: boolean;
  onClose: () => void;
}

export function ExerciseVideoPlayer({
  videoUrl,
  exerciseName,
  visible,
  onClose,
}: ExerciseVideoPlayerProps) {
  const [loading, setLoading] = useState(true);

  const videoId = extractYouTubeVideoId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>{Strings.exerciseVideoTitle}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeText}>{Strings.exerciseVideoClose}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerContainer}>
          {!embedUrl ? (
            <View style={styles.unavailable}>
              <Text style={styles.unavailableEmoji}>📹</Text>
              <Text style={styles.unavailableText}>{Strings.exerciseVideoUnavailable}</Text>
            </View>
          ) : (
            <>
              {loading && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator color={Colors.athlete} size="large" />
                </View>
              )}
              <WebView
                source={{ uri: embedUrl }}
                style={styles.webview}
                onLoadEnd={() => setLoading(false)}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: { flex: 1, marginRight: Spacing.md },
  headerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  unavailableEmoji: { fontSize: 48 },
  unavailableText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
