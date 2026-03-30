// Écran liste des salons de chat - MeedNess React Native (Version Finale)

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useChatStore } from '../../store/stores/useChatStore';
import type { ChatRoom, RoomType } from '../../types/chat';
import type { ChatStackParamList } from '../../navigation/ChatNavigator';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

type FilterTab = 'all' | 'groups' | 'direct';

const ROOM_ICON: Record<RoomType, string> = {
  general: 'globe',
  team: 'people',
  announcement: 'megaphone',
  direct: 'person',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function RoomItem({ room, onPress, isOnline }: { room: ChatRoom; onPress: () => void; isOnline?: boolean }) {
  const lastMsg = room.last_message;
  const preview = lastMsg?.content
    ? lastMsg.content.length > 50
      ? lastMsg.content.substring(0, 50) + '...'
      : lastMsg.content
    : 'Aucun message';

  const icon = ROOM_ICON[room.type] || 'chatbubble';

  return (
    <TouchableOpacity style={styles.roomItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, room.unread_count > 0 && styles.avatarUnread]}>
        <Ionicons name={icon as any} size={22} color={colors.primary[500]} />
        {isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.roomContent}>
        <View style={styles.roomHeader}>
          <Text style={[styles.roomName, room.unread_count > 0 && styles.roomNameUnread]} numberOfLines={1}>
            {room.name}
          </Text>
          {lastMsg?.created_at && (
            <Text style={[styles.roomTime, room.unread_count > 0 && styles.roomTimeUnread]}>
              {formatTime(lastMsg.created_at)}
            </Text>
          )}
        </View>
        <View style={styles.roomFooter}>
          <Text style={[styles.roomPreview, room.unread_count > 0 && styles.roomPreviewUnread]} numberOfLines={1}>
            {lastMsg?.sender ? `${lastMsg.sender.username}: ${preview}` : preview}
          </Text>
          {room.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {room.unread_count > 99 ? '99+' : room.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonItem() {
  return (
    <View style={styles.roomItem}>
      <View style={[styles.avatar, styles.skeleton]} />
      <View style={styles.roomContent}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '80%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

function FilterTabs({ active, onChange }: { active: FilterTab; onChange: (tab: FilterTab) => void }) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'groups', label: 'Groupes' },
    { key: 'direct', label: 'DM' },
  ];

  return (
    <View style={styles.filterContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.filterTab, active === tab.key && styles.filterTabActive]}
          onPress={() => onChange(tab.key)}
        >
          <Text style={[styles.filterTabText, active === tab.key && styles.filterTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { rooms, isLoading, fetchRooms, onlineUsers } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'all') return true;
    if (filter === 'direct') return room.type === 'direct';
    return room.type !== 'direct';
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  const handleRoomPress = (room: ChatRoom) => {
    navigation.navigate('ChatRoom', { roomId: room.id, roomName: room.name });
  };

  const handleCreateRoom = () => {
    navigation.navigate('CreateRoom');
  };

  const handleNewDM = () => {
    navigation.navigate('UserSearch');
  };

  if (isLoading && rooms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleNewDM} style={styles.headerButton}>
              <Ionicons name="person-add" size={22} color={colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateRoom} style={styles.headerButton}>
              <Ionicons name="add-circle" size={28} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonItem key={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleNewDM} style={styles.headerButton}>
            <Ionicons name="person-add" size={22} color={colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateRoom} style={styles.headerButton}>
            <Ionicons name="add-circle" size={28} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <FilterTabs active={filter} onChange={setFilter} />

      {filteredRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.primary[300]} />
          </View>
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySubtitle}>
            Créez un salon ou envoyez un message direct pour commencer
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateRoom}>
              <Ionicons name="add" size={20} color={colors.text.inverse} />
              <Text style={styles.emptyButtonText}>Nouveau salon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emptyButtonOutline} onPress={handleNewDM}>
              <Ionicons name="person-add" size={20} color={colors.primary[500]} />
              <Text style={styles.emptyButtonOutlineText}>Nouveau DM</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RoomItem
              room={item}
              onPress={() => handleRoomPress(item)}
              isOnline={item.type === 'direct' && Object.values(onlineUsers).some(Boolean)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterTabText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarUnread: {
    backgroundColor: colors.primary[100],
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    ...typography.label,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  roomNameUnread: {
    fontWeight: '700',
  },
  roomTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  roomTimeUnread: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomPreview: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  roomPreviewUnread: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  emptyActions: {
    gap: spacing.md,
    alignItems: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  emptyButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyButtonOutlineText: {
    ...typography.button,
    color: colors.primary[500],
  },
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
  },
});
