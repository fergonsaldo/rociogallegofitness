import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useMessageStore } from '../../../src/presentation/stores/messageStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function AthleteMessagesScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { conversations, isLoading, fetchConversations, getOrOpenConversation } = useMessageStore();
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchConversations(user.id);
      const interval = setInterval(() => {
        if (user?.id) fetchConversations(user.id);
      }, 10000);
      return () => clearInterval(interval);
    }, [user?.id]),
  );

  // Athlete has at most one conversation
  const conv = conversations[0];

  const handleOpenChat = () => {
    if (!conv) return;
    router.push({
      pathname: '/(athlete)/messages/[id]',
      params: { id: conv.id, name: conv.otherUserName ?? '' },
    });
  };

  const handleStartConversation = async () => {
    if (!user?.id) return;
    setStarting(true);
    try {
      // Find the coach assigned to this athlete
      const { data, error } = await supabase
        .from('coach_athletes')
        .select('coach_id, users!coach_athletes_coach_id_fkey(full_name)')
        .eq('athlete_id', user.id)
        .limit(1)
        .single();

      if (error || !data) {
        Alert.alert('Sin coach asignado', 'Todavía no tienes un coach asignado.');
        return;
      }

      const coachId   = data.coach_id;
      const coachName = (data.users as any)?.full_name ?? 'Coach';

      const conversation = await getOrOpenConversation(coachId, user.id);
      router.push({
        pathname: '/(athlete)/messages/[id]',
        params: { id: conversation.id, name: coachName },
      });
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la conversación');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading && !conv) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{Strings.messagesTitle}</Text>
        </View>
        <ActivityIndicator style={styles.loader} color={Colors.athlete} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.messagesTitle}</Text>
      </View>

      {conv ? (
        <TouchableOpacity style={styles.convRow} onPress={handleOpenChat} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(conv.otherUserName?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={styles.convContent}>
            <View style={styles.convHeader}>
              <Text style={styles.convName} numberOfLines={1}>{conv.otherUserName ?? '—'}</Text>
              {conv.lastMessageAt && (
                <Text style={styles.convTime}>
                  {conv.lastMessageAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            <View style={styles.convFooter}>
              <Text style={styles.convPreview} numberOfLines={1}>
                {conv.lastMessageBody ?? ''}
              </Text>
              {conv.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>{Strings.messagesEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.messageAthleteEmptySubtitle}</Text>
          <TouchableOpacity
            style={[styles.startBtn, starting && styles.startBtnDisabled]}
            onPress={handleStartConversation}
            disabled={starting}
            activeOpacity={0.8}
          >
            {starting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.startBtnText}>💬 Escribir a mi coach</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:           { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  loader:          { marginTop: Spacing.xxl },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyEmoji:      { fontSize: 48 },
  emptyText:       { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle:   { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  startBtn:        { backgroundColor: Colors.athlete, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  startBtnDisabled:{ backgroundColor: Colors.textMuted },
  startBtnText:    { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  convRow:         { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  avatar:          { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.athleteSubtle, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: FontSize.lg, fontWeight: '700', color: Colors.athlete },
  convContent:     { flex: 1, gap: 3 },
  convHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName:        { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  convTime:        { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  convFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview:     { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  badge:           { backgroundColor: Colors.athlete, borderRadius: BorderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: Spacing.sm },
  badgeText:       { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
});
