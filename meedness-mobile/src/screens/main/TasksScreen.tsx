// Écran principal Tâches — Liste des tableaux — MeedNess Phase 4

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { useTaskStore } from '../../store/stores/useTaskStore';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import type { Board } from '../../types/task';

type TasksNavProp = NativeStackNavigationProp<any>;

const COLUMN_DONE_TYPES = ['done'];

function getBoardProgress(board: Board) {
  if (!board.columns || board.tasks_count === 0) return 0;
  const done = board.columns
    .filter((c) => COLUMN_DONE_TYPES.includes(c.column_type))
    .reduce((s, c) => s + c.tasks_count, 0);
  return Math.round((done / board.tasks_count) * 100);
}

function SkeletonCard() {
  return (
    <View style={[styles.card, { opacity: 0.4 }]}>
      <View style={{ width: '60%', height: 18, backgroundColor: colors.neutral[200], borderRadius: 4 }} />
      <View style={{ width: '40%', height: 14, backgroundColor: colors.neutral[200], borderRadius: 4, marginTop: 8 }} />
      <View style={{ width: '100%', height: 6, backgroundColor: colors.neutral[200], borderRadius: 3, marginTop: 12 }} />
    </View>
  );
}

export function TasksScreen() {
  const navigation = useNavigation<TasksNavProp>();
  const { boards, isLoading, fetchBoards } = useTaskStore();
  const { organization } = useOrganizationStore();
  const [refreshing, setRefreshing] = useState(false);

  const orgId = organization?.id;

  useEffect(() => {
    if (orgId) fetchBoards(orgId);
  }, [orgId]);

  const onRefresh = useCallback(async () => {
    if (!orgId) return;
    setRefreshing(true);
    await fetchBoards(orgId);
    setRefreshing(false);
  }, [orgId]);

  const renderBoard = ({ item }: { item: Board }) => {
    const progress = getBoardProgress(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          useTaskStore.getState().setActiveBoard(item);
          navigation.navigate('Board', { boardId: item.id, boardName: item.name });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name={item.team ? 'people' : 'grid'} size={20} color={colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="checkbox-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.statText}>{item.tasks_count} tâches</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.statText}>{item.members_count} membres</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tâches</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateBoard')}
        >
          <Ionicons name="add" size={24} color={colors.background.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && boards.length === 0 ? (
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : boards.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="clipboard-outline" size={64} color={colors.primary[300]} />
          </View>
          <Text style={styles.emptyTitle}>Aucun tableau</Text>
          <Text style={styles.emptySubtitle}>
            Créez un tableau Kanban pour organiser les tâches de votre équipe.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('CreateBoard')}
          >
            <Ionicons name="add" size={20} color={colors.background.primary} />
            <Text style={styles.emptyBtnText}>Créer un tableau</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(b) => b.id}
          renderItem={renderBoard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing['4xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center', alignItems: 'center',
  },
  list: { padding: spacing.lg, paddingBottom: spacing['6xl'] },
  skeletonList: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { ...typography.h4, color: colors.text.primary },
  cardDesc: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
  },
  progressBg: {
    flex: 1, height: 6, backgroundColor: colors.neutral[200], borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
  progressText: { ...typography.caption, color: colors.text.secondary, width: 36, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.caption, color: colors.text.tertiary },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'],
  },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing['2xl'],
  },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing['2xl'] },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary[500], paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
  },
  emptyBtnText: { ...typography.button, color: colors.text.inverse },
});
