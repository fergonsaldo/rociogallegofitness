import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useMessageStore } from '../../../src/presentation/stores/messageStore';
import { Conversation } from '../../../src/domain/entities/Message';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

function formatTime(date?: Date): string {
  if (!date) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return Strings.messageYesterday;
  if (diffDays < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' });
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function ConversationRow({ item, onPress }: { item: Conversation; onPress: () => void }) {
  const initial = (item.otherUserName ?? '?')[0].toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName} numberOfLines={1}>{item.otherUserName ?? '—'}</Text>
          <Text style={styles.rowTime}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.rowFooter}>
          <Text style={styles.rowPreview} numberOfLines={1}>
            {item.lastMessageBody ?? ''}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CoachMessagesScreen() {
  const router                    = useRouter();
  const { user }                  = useAuthStore();
  const { conversations, isLoading, fetchConversations } = useMessageStore();

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchConversations(user.id);
      const interval = setInterval(() => {
        if (user?.id) fetchConversations(user.id);
      }, 10000);
      return () => clearInterval(interval);
    }, [user?.id]),
  );

  const handlePress = (conv: Conversation) => {
    router.push({
      pathname: '/(coach)/messages/[id]',
      params: { id: conv.id, name: conv.otherUserName ?? '' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.messagesTitle}</Text>
      </View>

      {isLoading && conversations.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>{Strings.messagesEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.messagesEmptySubtitle}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow item={item} onPress={() => handlePress(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  loader:       { marginTop: Spacing.xxl },
  list:         { paddingTop: Spacing.xs },
  separator:    { height: 1, backgroundColor: Colors.borderLight, marginLeft: 76 },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, gap: Spacing.md },
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  rowContent:   { flex: 1, gap: 3 },
  rowHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName:      { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  rowTime:      { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  rowFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowPreview:   { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  badge:        { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: Spacing.sm },
  badgeText:    { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
});
