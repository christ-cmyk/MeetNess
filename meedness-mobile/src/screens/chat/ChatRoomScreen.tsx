// Écran conversation chat - MeedNess React Native (Version Finale)

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useChatStore } from '../../store/stores/useChatStore';
import { useAuthStore } from '../../store/stores/useAuthStore';
import type { ChatMessage } from '../../types/chat';
import type { ChatStackParamList } from '../../navigation/ChatNavigator';
import * as Clipboard from 'expo-clipboard';

type ChatRoomRouteProp = RouteProp<ChatStackParamList, 'ChatRoom'>;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(d1: string, d2: string): boolean {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Reply Preview ───
function ReplyPreview({ replyTo, onCancel }: { replyTo: ChatMessage; onCancel: () => void }) {
  return (
    <View style={styles.replyPreview}>
      <View style={styles.replyPreviewBar} />
      <View style={styles.replyPreviewContent}>
        <Text style={styles.replyPreviewName}>{replyTo.sender.username}</Text>
        <Text style={styles.replyPreviewText} numberOfLines={1}>{replyTo.content}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.replyPreviewClose}>
        <Ionicons name="close" size={18} color={colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Reactions Row ───
function ReactionsRow({ reactions, userId, onToggle }: { reactions: ChatMessage['reactions']; userId?: string; onToggle: (emoji: string) => void }) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.user.id === userId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  return (
    <View style={styles.reactionsRow}>
      {Object.entries(grouped).map(([emoji, data]) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.reactionChip, data.hasOwn && styles.reactionChipOwn]}
          onPress={() => onToggle(emoji)}
        >
          <Text style={styles.reactionEmoji}>{emoji}</Text>
          {data.count > 1 && <Text style={styles.reactionCount}>{data.count}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Message Bubble ───
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  userId?: string;
  onLongPress: (message: ChatMessage) => void;
  onReactionToggle: (messageId: string, emoji: string) => void;
}

function MessageBubble({ message, isOwn, showAvatar, userId, onLongPress, onReactionToggle }: MessageBubbleProps) {
  if (message.is_deleted) {
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && <View style={[styles.messageAvatar, !showAvatar && styles.messageAvatarHidden]}>
          {showAvatar && <View style={styles.avatarCircle}><Text style={styles.avatarText}>{message.sender.username[0]?.toUpperCase() || '?'}</Text></View>}
        </View>}
        <View style={[styles.bubble, styles.bubbleDeleted]}>
          <Text style={styles.deletedText}>🚫 Ce message a été supprimé</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress(message)}
      style={[styles.messageRow, isOwn && styles.messageRowOwn]}
    >
      {!isOwn && (
        <View style={[styles.messageAvatar, !showAvatar && styles.messageAvatarHidden]}>
          {showAvatar && (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{message.sender.username[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ maxWidth: '75%' }}>
        {/* Reply preview inside bubble */}
        {message.reply_to && (
          <View style={[styles.inlineReply, isOwn ? styles.inlineReplyOwn : styles.inlineReplyOther]}>
            <Text style={styles.inlineReplyName}>{message.reply_to.sender.username}</Text>
            <Text style={styles.inlineReplyText} numberOfLines={1}>{message.reply_to.content}</Text>
          </View>
        )}

        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {!isOwn && showAvatar && (
            <Text style={styles.senderName}>{message.sender.username}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            {message.is_edited && (
              <Text style={[styles.editedLabel, isOwn && styles.editedLabelOwn]}>modifié</Text>
            )}
            <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
              {formatMessageTime(message.created_at)}
            </Text>
            {isOwn && (
              <Ionicons
                name={message.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={message.is_read ? colors.primary[300] : 'rgba(255,255,255,0.5)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>

        <ReactionsRow
          reactions={message.reactions}
          userId={userId}
          onToggle={(emoji) => onReactionToggle(message.id, emoji)}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Date Separator ───
function DateSeparator({ dateStr }: { dateStr: string }) {
  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{formatDateSeparator(dateStr)}</Text>
      <View style={styles.dateLine} />
    </View>
  );
}

// ─── Typing Indicator ───
function TypingIndicatorView({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const text = names.length === 1
    ? `${names[0]} est en train d'écrire...`
    : `${names.join(', ')} sont en train d'écrire...`;

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, styles.typingDot1]} />
        <View style={[styles.typingDot, styles.typingDot2]} />
        <View style={[styles.typingDot, styles.typingDot3]} />
      </View>
      <Text style={styles.typingText}>{text}</Text>
    </View>
  );
}

// ─── Quick Reaction Picker ───
function QuickReactionPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <View style={styles.reactionPicker}>
      {QUICK_REACTIONS.map((emoji) => (
        <TouchableOpacity key={emoji} onPress={() => { onSelect(emoji); onClose(); }} style={styles.reactionPickerItem}>
          <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ───
export function ChatRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatRoomRouteProp>();
  const { roomId, roomName } = route.params;

  const user = useAuthStore((s) => s.user);
  const {
    messages: allMessages,
    typingUsers,
    isConnected,
    isLoading,
    hasMoreMessages,
    activeRoom,
    onlineUsers,
    connectToRoom,
    disconnectFromRoom,
    sendMessage,
    loadMessages,
    setTyping,
    markAsRead,
    setActiveRoom,
    deleteMessage,
    addReaction,
    removeReaction,
  } = useChatStore();

  const messages = allMessages[roomId] || [];
  const roomTyping = (typingUsers[roomId] || []).filter((t) => t.user_id !== user?.id);
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [page, setPage] = useState(1);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);

  // Online count
  const onlineCount = Object.values(onlineUsers).filter(Boolean).length;

  useEffect(() => {
    loadMessages(roomId, 1);
    connectToRoom(roomId);
    markAsRead(roomId);

    return () => {
      disconnectFromRoom();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [roomId]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    sendMessage(trimmed, replyTo?.id);
    setInputText('');
    setReplyTo(null);

    if (isTypingRef.current) {
      setTyping(false);
      isTypingRef.current = false;
    }
  }, [inputText, sendMessage, setTyping, replyTo]);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);

    if (!isTypingRef.current && text.length > 0) {
      setTyping(true);
      isTypingRef.current = true;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (isTypingRef.current) {
        setTyping(false);
        isTypingRef.current = false;
      }
    }, 2000);
  }, [setTyping]);

  const handleLoadMore = useCallback(() => {
    if (hasMoreMessages[roomId] && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(roomId, nextPage);
    }
  }, [hasMoreMessages, roomId, isLoading, page, loadMessages]);

  const handleLongPress = useCallback((message: ChatMessage) => {
    if (message.is_deleted) return;

    const options: string[] = ['Répondre', 'Réagir', 'Copier'];
    const isOwnMessage = message.sender.id === user?.id;
    if (isOwnMessage) options.push('Supprimer');
    options.push('Annuler');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: isOwnMessage ? options.length - 2 : undefined },
        (index) => handleMessageAction(index, message, isOwnMessage),
      );
    } else {
      // Android: simple Alert-based menu
      Alert.alert('Message', undefined, [
        { text: 'Répondre', onPress: () => setReplyTo(message) },
        { text: 'Réagir', onPress: () => setReactionTarget(message.id) },
        { text: 'Copier', onPress: () => Clipboard.setStringAsync(message.content) },
        ...(isOwnMessage ? [{ text: 'Supprimer', style: 'destructive' as const, onPress: () => confirmDelete(message.id) }] : []),
        { text: 'Annuler', style: 'cancel' as const },
      ]);
    }
  }, [user?.id]);

  const handleMessageAction = (index: number, message: ChatMessage, isOwnMessage: boolean) => {
    switch (index) {
      case 0: setReplyTo(message); break;
      case 1: setReactionTarget(message.id); break;
      case 2: Clipboard.setStringAsync(message.content); break;
      case 3: if (isOwnMessage) confirmDelete(message.id); break;
    }
  };

  const confirmDelete = (messageId: string) => {
    Alert.alert('Supprimer le message', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMessage(messageId) },
    ]);
  };

  const handleReactionToggle = useCallback((messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const hasReacted = msg.reactions?.some((r) => r.emoji === emoji && r.user.id === user?.id);
    if (hasReacted) {
      removeReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
  }, [messages, user?.id, addReaction, removeReaction]);

  // Build list with date separators
  const listData = useMemo(() => {
    const items: Array<{ type: 'message' | 'date'; data: any; key: string }> = [];
    let lastDate = '';

    messages.forEach((msg, index) => {
      const msgDate = msg.created_at;
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({ type: 'date', data: msgDate, key: `date-${msgDate}-${index}` });
        lastDate = msgDate;
      }

      const prevMsg = index > 0 ? messages[index - 1] : null;
      const showAvatar = !prevMsg || prevMsg.sender.id !== msg.sender.id || !isSameDay(prevMsg.created_at, msg.created_at);

      items.push({ type: 'message', data: { ...msg, showAvatar }, key: msg.id });
    });

    return items;
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{roomName}</Text>
          <Text style={styles.headerSubtitle}>
            {isConnected
              ? `${activeRoom?.members_count || '?'} membres${onlineCount > 0 ? ` • ${onlineCount} en ligne` : ''}`
              : 'Connexion...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Quick Reaction Picker overlay */}
      {reactionTarget && (
        <View style={styles.reactionOverlay}>
          <QuickReactionPicker
            onSelect={(emoji) => handleReactionToggle(reactionTarget, emoji)}
            onClose={() => setReactionTarget(null)}
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          if (item.type === 'date') return <DateSeparator dateStr={item.data} />;
          return (
            <MessageBubble
              message={item.data}
              isOwn={item.data.sender.id === user?.id}
              showAvatar={item.data.showAvatar}
              userId={user?.id}
              onLongPress={handleLongPress}
              onReactionToggle={handleReactionToggle}
            />
          );
        }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onStartReached={handleLoadMore}
        onStartReachedThreshold={0.1}
        ListHeaderComponent={
          isLoading && page > 1 ? (
            <ActivityIndicator color={colors.primary[500]} style={{ padding: spacing.md }} />
          ) : null
        }
        ListFooterComponent={<TypingIndicatorView names={roomTyping.map((t) => t.username)} />}
        onContentSizeChange={() => {
          if (page === 1) flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Reply preview */}
      {replyTo && <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.text.tertiary}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={2000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? colors.text.inverse : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing['5xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backButton: { padding: spacing.xs, marginRight: spacing.sm },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.h4, color: colors.text.primary },
  headerSubtitle: { ...typography.caption, color: colors.text.tertiary },
  headerAction: { padding: spacing.sm },

  messagesList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  messageRow: { flexDirection: 'row', marginBottom: spacing.xs, alignItems: 'flex-end' },
  messageRowOwn: { flexDirection: 'row-reverse' },
  messageAvatar: { width: 32, marginRight: spacing.sm },
  messageAvatarHidden: { opacity: 0 },
  avatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.caption, color: colors.primary[600], fontWeight: '600' },

  bubble: { maxWidth: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.xl },
  bubbleOwn: { backgroundColor: colors.primary[500], borderBottomRightRadius: borderRadius.sm },
  bubbleOther: { backgroundColor: colors.background.primary, borderBottomLeftRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border.light },
  bubbleDeleted: { backgroundColor: colors.background.tertiary, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  deletedText: { ...typography.bodySmall, color: colors.text.tertiary, fontStyle: 'italic' },

  senderName: { ...typography.caption, color: colors.primary[600], fontWeight: '600', marginBottom: 2 },
  messageText: { ...typography.body, color: colors.text.primary },
  messageTextOwn: { color: colors.text.inverse },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  messageTime: { fontSize: 10, color: colors.text.tertiary },
  messageTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  editedLabel: { fontSize: 9, color: colors.text.tertiary, fontStyle: 'italic', marginRight: 4 },
  editedLabelOwn: { color: 'rgba(255,255,255,0.5)' },

  // Inline reply
  inlineReply: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderLeftWidth: 3, borderRadius: borderRadius.sm, marginBottom: 4 },
  inlineReplyOwn: { borderLeftColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.1)' },
  inlineReplyOther: { borderLeftColor: colors.primary[300], backgroundColor: colors.primary[50] },
  inlineReplyName: { ...typography.caption, fontWeight: '600', color: colors.primary[600] },
  inlineReplyText: { ...typography.caption, color: colors.text.secondary },

  // Reactions
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.light },
  reactionChipOwn: { borderColor: colors.primary[300], backgroundColor: colors.primary[50] },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11, color: colors.text.secondary, marginLeft: 2 },

  // Reaction picker overlay
  reactionOverlay: { position: 'absolute', top: 120, left: 0, right: 0, zIndex: 100, alignItems: 'center' },
  reactionPicker: { flexDirection: 'row', backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  reactionPickerItem: { padding: 4 },
  reactionPickerEmoji: { fontSize: 24 },

  // Reply preview
  replyPreview: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: colors.border.light },
  replyPreviewBar: { width: 3, height: '100%', backgroundColor: colors.primary[500], borderRadius: 2, marginRight: spacing.sm },
  replyPreviewContent: { flex: 1 },
  replyPreviewName: { ...typography.caption, fontWeight: '600', color: colors.primary[600] },
  replyPreviewText: { ...typography.caption, color: colors.text.secondary },
  replyPreviewClose: { padding: spacing.xs },

  // Date separator
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border.light },
  dateText: { ...typography.caption, color: colors.text.tertiary, marginHorizontal: spacing.md },

  // Typing
  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  typingDots: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text.tertiary, marginHorizontal: 1 },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },
  typingText: { ...typography.caption, color: colors.text.tertiary, fontStyle: 'italic' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, paddingBottom: spacing['3xl'],
    backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: colors.border.light,
  },
  attachButton: { padding: spacing.sm, marginRight: spacing.xs },
  input: {
    flex: 1, ...typography.body, color: colors.text.primary,
    backgroundColor: colors.background.tertiary, borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, maxHeight: 100, minHeight: 40,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500], justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
  sendButtonDisabled: { backgroundColor: colors.background.tertiary },
});
