// Écran liste des Objectifs — MeedNess Phase 5

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useGoalStore } from '../../store/stores/useGoalStore';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import type { Goal, GoalStatus } from '../../types/goal';

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: 'En bonne voie', color: '#10B981' },
  at_risk: { label: 'À risque', color: '#F59E0B' },
  behind: { label: 'En retard', color: '#EF4444' },
  completed: { label: 'Complété', color: '#3B82F6' },
  cancelled: { label: 'Annulé', color: '#6B7280' },
};

type FilterKey = 'all' | 'active' | 'at_risk' | 'completed';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'En cours' },
  { key: 'at_risk', label: 'À risque' },
  { key: 'completed', label: 'Complétés' },
];

function MiniProgressCircle({ progress, color, size = 52 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function SkeletonCard() {
  return (
    <View style={[styles.card, { opacity: 0.5 }]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.neutral[200] }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ width: '60%', height: 16, borderRadius: 4, backgroundColor: colors.neutral[200] }} />
        <View style={{ width: '40%', height: 12, borderRadius: 4, backgroundColor: colors.neutral[200] }} />
        <View style={{ width: '80%', height: 6, borderRadius: 3, backgroundColor: colors.neutral[200] }} />
      </View>
    </View>
  );
}

export function GoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { organization } = useOrganizationStore();
  const { goals, isLoading, fetchGoals } = useGoalStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const orgId = organization?.id;

  const loadGoals = useCallback(async () => {
    if (!orgId) return;
    const params: Record<string, string> | undefined =
      filter === 'active' ? { status: 'on_track' }
        : filter === 'at_risk' ? { status: 'at_risk' }
        : filter === 'completed' ? { status: 'completed' }
        : undefined;
    await fetchGoals(orgId, params);
  }, [orgId, filter, fetchGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  const filteredGoals = goals;

  const renderGoal = ({ item }: { item: Goal }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.on_track;
    const krDone = item.key_results?.filter((kr) => kr.progress >= 100).length ?? 0;
    const krTotal = item.key_results_count ?? item.key_results?.length ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          useGoalStore.getState().setActiveGoal(item);
          navigation.navigate('GoalDetail', { goalId: item.id });
        }}
      >
        <View style={styles.cardLeft}>
          <MiniProgressCircle progress={item.progress ?? 0} color={cfg.color} />
          <Text style={styles.progressText}>{Math.round(item.progress ?? 0)}%</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={styles.krText}>{krDone}/{krTotal} résultats clés</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={item.is_overdue ? '#EF4444' : colors.text.tertiary} />
            <Text style={[styles.metaText, item.is_overdue && { color: '#EF4444' }]}>
              {item.days_remaining > 0 ? `${item.days_remaining}j restants` : item.is_overdue ? 'En retard' : 'Terminé'}
            </Text>

            {(item.members?.length ?? 0) > 0 && (
              <View style={styles.avatarRow}>
                {item.members.slice(0, 3).map((m) => (
                  <View key={m.id} style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {m.user.username?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                  </View>
                ))}
                {item.members.length > 3 && (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.neutral[300] }]}>
                    <Text style={styles.avatarInitial}>+{item.members.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(item.progress ?? 0, 100)}%`, backgroundColor: cfg.color }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Objectifs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading && goals.length === 0 ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoal}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Aucun objectif défini</Text>
              <Text style={styles.emptySubtitle}>Créez votre premier objectif pour suivre vos résultats</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: { backgroundColor: colors.primary[500] },
  filterText: { ...typography.labelSmall, color: colors.text.secondary },
  filterTextActive: { color: colors.text.inverse },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: { alignItems: 'center', gap: 4 },
  progressText: { ...typography.labelSmall, color: colors.text.secondary },
  cardContent: { flex: 1, gap: 6 },
  cardTitle: { ...typography.label, color: colors.text.primary },
  statusRow: { flexDirection: 'row' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { ...typography.caption },
  krText: { ...typography.caption, color: colors.text.tertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...typography.caption, color: colors.text.tertiary },
  avatarRow: { flexDirection: 'row', marginLeft: 'auto' },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
    borderWidth: 1.5,
    borderColor: colors.background.primary,
  },
  avatarInitial: { fontSize: 10, fontWeight: '600', color: colors.primary[700] },
  progressBar: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: { height: 4, borderRadius: 2 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['6xl'],
    gap: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.text.primary },
  emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
