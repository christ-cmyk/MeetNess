// Écran recherche utilisateurs pour DM - MeedNess React Native

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useChatStore } from '../../store/stores/useChatStore';
import type { SearchUserResult } from '../../services/api/chat.api';
import type { ChatStackParamList } from '../../navigation/ChatNavigator';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

export function UserSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { searchUsers, getOrCreateDirectRoom } = useChatStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const users = await searchUsers(text);
      setResults(users);
      setIsSearching(false);
    }, 400);
  }, [searchUsers]);

  const handleUserPress = async (user: SearchUserResult) => {
    if (user.is_blocked) return;
    try {
      setIsCreating(true);
      const room = await getOrCreateDirectRoom(user.id);
      navigation.replace('ChatRoom', { roomId: room.id, roomName: user.username });
    } catch (error) {
      console.error('Erreur création DM:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau message</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          placeholderTextColor={colors.text.tertiary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {isSearching && (
        <ActivityIndicator color={colors.primary[500]} style={{ marginTop: spacing.xl }} />
      )}

      {/* Creating DM overlay */}
      {isCreating && (
        <View style={styles.creatingOverlay}>
          <ActivityIndicator color={colors.primary[500]} />
          <Text style={styles.creatingText}>Ouverture de la conversation...</Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userItem, item.is_blocked && styles.userItemBlocked]}
            onPress={() => handleUserPress(item)}
            disabled={item.is_blocked || isCreating}
            activeOpacity={0.7}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.username[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.username}</Text>
              {item.full_name && (
                <Text style={styles.userFullName}>{item.full_name}</Text>
              )}
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            {item.is_blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedText}>Bloqué</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.length >= 2 && !isSearching ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
          ) : query.length < 2 && query.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.hintText}>Tapez au moins 2 caractères</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing['5xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.xl, marginVertical: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary, borderRadius: borderRadius.xl, gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text.primary, paddingVertical: 4 },
  listContent: { paddingBottom: spacing.xl },
  userItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.light,
  },
  userItemBlocked: { opacity: 0.5 },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  userAvatarText: { ...typography.label, color: colors.primary[600], fontWeight: '600', fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { ...typography.label, color: colors.text.primary },
  userFullName: { ...typography.bodySmall, color: colors.text.secondary },
  userEmail: { ...typography.caption, color: colors.text.tertiary },
  blockedBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: '#FEE2E2' },
  blockedText: { ...typography.caption, color: '#DC2626', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.md },
  emptyText: { ...typography.body, color: colors.text.tertiary },
  hintText: { ...typography.bodySmall, color: colors.text.tertiary },
  creatingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  creatingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
});
