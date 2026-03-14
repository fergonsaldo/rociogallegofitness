import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ListRenderItemInfo,
} from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useMessageStore } from '../../../src/presentation/stores/messageStore';
import { Message } from '../../../src/domain/entities/Message';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
          {message.body}
        </Text>
        <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
          {formatMessageTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();
  const { messages, isLoading, isSending, fetchMessages, sendMessage } = useMessageStore();

  const [text, setText]       = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const conversationId = params.id;
  const otherName      = params.name ?? '';

  useFocusEffect(
    useCallback(() => {
      if (conversationId && user?.id) {
        fetchMessages(conversationId, user.id).then(() => {
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
        });
      }

      const interval = setInterval(() => {
        if (conversationId && user?.id) fetchMessages(conversationId, user.id);
      }, 5000);

      return () => clearInterval(interval);
    }, [conversationId, user?.id]),
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || !conversationId) return;
    setText('');
    await sendMessage(conversationId, user.id, trimmed);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Message>) => (
    <MessageBubble message={item} isOwn={item.senderId === user?.id} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{(otherName[0] ?? '?').toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {isLoading && messages.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={Strings.messageInputPlaceholder}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>▲</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  flex:             { flex: 1 },
  loader:           { flex: 1, marginTop: Spacing.xxl },
  // Header
  header:           { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  backBtn:          { padding: Spacing.xs },
  backText:         { fontSize: 28, color: Colors.primary, lineHeight: 32 },
  headerInfo:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  headerAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  headerName:       { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  // Messages
  messageList:      { paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.xs },
  bubbleRow:        { flexDirection: 'row', marginVertical: 2 },
  bubbleRowOwn:     { justifyContent: 'flex-end' },
  bubbleRowOther:   { justifyContent: 'flex-start' },
  bubble:           { maxWidth: '75%', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4 },
  bubbleOwn:        { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther:      { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText:       { fontSize: FontSize.md },
  bubbleTextOwn:    { color: '#fff' },
  bubbleTextOther:  { color: Colors.textPrimary },
  bubbleTime:       { fontSize: FontSize.xs, alignSelf: 'flex-end' },
  bubbleTimeOwn:    { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeOther:  { color: Colors.textMuted },
  // Input
  inputBar:         { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  input:            { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:  { backgroundColor: Colors.textMuted },
  sendBtnText:      { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
