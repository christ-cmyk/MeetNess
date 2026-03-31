// Dashboard Accueil — MeedNess Phase 5

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import { useGoalStore } from '../../store/stores/useGoalStore';
import { useChatStore } from '../../store/stores/useChatStore';
import type { OrganizationStats } from '../../types/goal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Progress ring ── */
function ProgressArc({
  progress,
  color,
  radius,
  strokeWidth,
  size,
}: {
  progress: number;
  color: string;
  radius: number;
  strokeWidth: number;
  size: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(progress, 100)) / 100;
  return (
    <>
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
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </>
  );
}

function TripleRing({ stats }: { stats: OrganizationStats | null }) {
  const size = 200;
  const sw = 10;
  const gap = 4;
  const r1 = (size - sw) / 2;
  const r2 = r1 - sw - gap;
  const r3 = r2 - sw - gap;

  const tp = stats?.tasks_progress ?? 0;
  const gp = stats?.goals_progress ?? 0;
  const pp = stats?.punctuality_progress ?? 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <ProgressArc progress={tp} color="#3B82F6" radius={r1} strokeWidth={sw} size={size} />
        <ProgressArc progress={gp} color="#8B5CF6" radius={r2} strokeWidth={sw} size={size} />
        <ProgressArc progress={pp} color="#10B981" radius={r3} strokeWidth={sw} size={size} />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringScore}>{Math.round(stats?.global_score ?? 0)}%</Text>
      </View>

      <View style={styles.legendRow}>
        <LegendItem color="#3B82F6" label="Tâches" value={tp} />
        <LegendItem color="#8B5CF6" label="Objectifs" value={gp} />
        <LegendItem color="#10B981" label="Ponctualité" value={pp} />
      </View>
    </View>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label} {Math.round(value)}%</Text>
    </View>
  );
}

/* ── Summary card ── */
function SummaryCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/* ── Skeleton ── */
function DashboardSkeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.xl }}>
      <View style={{ width: '50%', height: 24, borderRadius: 6, backgroundColor: colors.neutral[200] }} />
      <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: colors.neutral[200], alignSelf: 'center' }} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flex: 1, height: 80, borderRadius: 12, backgroundColor: colors.neutral[200] }} />
        ))}
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { organization } = useOrganizationStore();
  const { stats, fetchStats, isLoading } = useGoalStore();
  const totalUnread = useChatStore((s) => s.rooms.reduce((sum, r) => sum + r.unread_count, 0));
  const [refreshing, setRefreshing] = useState(false);

  const orgId = organization?.id;

  const load = useCallback(async () => {
    if (orgId) await fetchStats(orgId);
  }, [orgId, fetchStats]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Bonjour {user?.username ?? ''} 👋</Text>
        {organization && <Text style={styles.orgName}>{organization.name}</Text>}
        <Text style={styles.dateLabel}>{dayName}</Text>
      </View>

      {isLoading && !stats ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Triple ring */}
          <View style={styles.ringSection}>
            <TripleRing stats={stats} />
          </View>

          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <SummaryCard icon="💬" value={totalUnread} label="Non lus" color="#3B82F6" />
            <SummaryCard icon="✅" value={stats?.tasks_total ? stats.tasks_total - stats.tasks_completed : 0} label="En cours" color="#F59E0B" />
            <SummaryCard icon="🎯" value={stats?.goals_total ? stats.goals_total - stats.goals_completed : 0} label="Objectifs" color="#8B5CF6" />
            <SummaryCard icon="⚠️" value={stats?.tasks_overdue ?? 0} label="En retard" color="#EF4444" />
          </View>

          {/* Team members */}
          {(stats?.members_stats?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Équipe</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
                {stats!.members_stats.map((m) => (
                  <View key={m.user_id} style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>{m.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.memberName} numberOfLines={1}>{m.username}</Text>
                    <Text style={styles.memberPct}>{Math.round(m.progress)}%</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  scrollContent: { paddingBottom: 120 },
  greeting: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  greetingTitle: { ...typography.h2, color: colors.text.primary },
  orgName: { ...typography.label, color: colors.primary[500], marginTop: 2 },
  dateLabel: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2, textTransform: 'capitalize' },
  ringSection: { paddingVertical: spacing.xl, alignItems: 'center' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, justifyContent: 'center', alignItems: 'center' },
  ringScore: { fontSize: 40, fontWeight: '700', color: colors.text.primary },
  legendRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: colors.text.secondary },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryValue: { ...typography.h3, color: colors.text.primary },
  summaryLabel: { ...typography.caption, color: colors.text.tertiary },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md },
  sectionTitle: { ...typography.label, color: colors.text.primary },
  membersScroll: { gap: spacing.lg, paddingRight: spacing.lg },
  memberItem: { alignItems: 'center', gap: 4, width: 60 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  memberInitial: { fontSize: 16, fontWeight: '600', color: colors.primary[700] },
  memberName: { ...typography.caption, color: colors.text.primary },
  memberPct: { ...typography.labelSmall, color: colors.text.secondary },
});
