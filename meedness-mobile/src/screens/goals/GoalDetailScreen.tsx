// Détail d'un Objectif OKR — MeedNess Phase 5

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useGoalStore } from '../../store/stores/useGoalStore';
import { goalAPI } from '../../services/api/goal.api';
import type { GoalStatus, KeyResult } from '../../types/goal';

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: 'En bonne voie', color: '#10B981' },
  at_risk: { label: 'À risque', color: '#F59E0B' },
  behind: { label: 'En retard', color: '#EF4444' },
  completed: { label: 'Complété', color: '#3B82F6' },
  cancelled: { label: 'Annulé', color: '#6B7280' },
};

function BigProgressCircle({ progress, color }: { progress: number; color: string }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.circleCenter}>
        <Text style={styles.circlePct}>{Math.round(progress)}%</Text>
        <Text style={styles.circleLabel}>Progression</Text>
      </View>
    </View>
  );
}

function KRProgressBar({ progress }: { progress: number }) {
  const clamp = Math.min(Math.max(progress, 0), 100);
  const barColor = clamp >= 70 ? '#10B981' : clamp >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <View style={styles.krBar}>
      <View style={[styles.krBarFill, { width: `${clamp}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export function GoalDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const goalId = route.params?.goalId as string;

  const { activeGoal, isLoading, archiveGoal, updateKeyResultValue, addComment, fetchGoals } = useGoalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [krModal, setKrModal] = useState<KeyResult | null>(null);
  const [krValue, setKrValue] = useState('');
  const [krNote, setKrNote] = useState('');

  const goal = activeGoal;

  const reload = useCallback(async () => {
    if (!goalId) return;
    try {
      const data = await goalAPI.getGoalDetail(goalId);
      useGoalStore.getState().setActiveGoal(data);
    } catch (error) {
      console.error(error);
    }
  }, [goalId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleArchive = () => {
    Alert.alert('Archiver', 'Voulez-vous archiver cet objectif ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        style: 'destructive',
        onPress: async () => {
          await archiveGoal(goalId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await addComment(goalId, commentText.trim());
    setCommentText('');
    reload();
  };

  const handleUpdateKR = async () => {
    if (!krModal || !krValue) return;
    await updateKeyResultValue(krModal.id, parseFloat(krValue), krNote || undefined);
    setKrModal(null);
    setKrValue('');
    setKrNote('');
    reload();
  };

  if (!goal) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{goal.title}</Text>
          <TouchableOpacity onPress={handleArchive}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        >
          <View style={styles.section}>
            <BigProgressCircle progress={goal.progress ?? 0} color={cfg.color} />
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {goal.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descText}>{goal.description}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Période</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.dateText}>{goal.start_date} → {goal.end_date}</Text>
              <Text style={[styles.daysText, goal.is_overdue && { color: '#EF4444' }]}>
                {goal.days_remaining > 0 ? `${goal.days_remaining}j restants` : goal.is_overdue ? 'En retard' : 'Terminé'}
              </Text>
            </View>
          </View>

          {(goal.members?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Membres</Text>
              <View style={styles.membersRow}>
                {goal.members.map((m) => (
                  <View key={m.id} style={styles.memberChip}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>{m.user.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.memberName}>{m.user.full_name || m.user.username}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résultats clés</Text>
            {(goal.key_results?.length ?? 0) === 0 ? (
              <Text style={styles.emptyKr}>Aucun résultat clé</Text>
            ) : (
              goal.key_results.map((kr) => (
                <View key={kr.id} style={styles.krCard}>
                  <View style={styles.krHeader}>
                    <Text style={styles.krTitle}>{kr.title}</Text>
                    <TouchableOpacity onPress={() => { setKrModal(kr); setKrValue(String(kr.current_value)); }}>
                      <Ionicons name="create-outline" size={20} color={colors.primary[500]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.krMetric}>
                    {kr.current_value} / {kr.target_value} {kr.unit ?? ''}
                  </Text>
                  <KRProgressBar progress={kr.progress ?? 0} />
                  <Text style={styles.krPct}>{Math.round(kr.progress ?? 0)}%</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.commentBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire…"
            placeholderTextColor={colors.text.tertiary}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity onPress={handleSendComment} disabled={!commentText.trim()}>
            <Ionicons name="send" size={22} color={commentText.trim() ? colors.primary[500] : colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <Modal visible={!!krModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Mettre à jour</Text>
              <Text style={styles.modalKrName}>{krModal?.title}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={krValue}
                onChangeText={setKrValue}
                placeholder="Nouvelle valeur"
                placeholderTextColor={colors.text.tertiary}
              />
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                value={krNote}
                onChangeText={setKrNote}
                placeholder="Note (optionnel)"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setKrModal(null)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleUpdateKR}>
                  <Text style={styles.modalConfirmText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.text.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  headerTitle: { ...typography.h4, color: colors.text.primary, flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.text.primary },
  circleCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  circlePct: { fontSize: 36, fontWeight: '700', color: colors.text.primary },
  circleLabel: { ...typography.caption, color: colors.text.secondary },
  statusRow: { flexDirection: 'row', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.label },
  descText: { ...typography.body, color: colors.text.secondary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { ...typography.bodySmall, color: colors.text.secondary },
  daysText: { ...typography.labelSmall, color: colors.text.tertiary, marginLeft: 'auto' },
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[100], borderRadius: borderRadius.full, paddingRight: 12, gap: 6 },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  memberInitial: { fontSize: 12, fontWeight: '600', color: colors.primary[700] },
  memberName: { ...typography.caption, color: colors.text.primary },
  emptyKr: { ...typography.body, color: colors.text.tertiary, textAlign: 'center', paddingVertical: spacing.xl },
  krCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  krHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  krTitle: { ...typography.label, color: colors.text.primary, flex: 1 },
  krMetric: { ...typography.bodySmall, color: colors.text.secondary },
  krBar: { height: 6, backgroundColor: colors.neutral[200], borderRadius: 3 },
  krBarFill: { height: 6, borderRadius: 3 },
  krPct: { ...typography.caption, color: colors.text.tertiary, textAlign: 'right' },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  commentInput: { flex: 1, ...typography.body, color: colors.text.primary, backgroundColor: colors.neutral[100], borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.md },
  modalTitle: { ...typography.h3, color: colors.text.primary },
  modalKrName: { ...typography.label, color: colors.text.secondary },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancel: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.neutral[100], alignItems: 'center' },
  modalCancelText: { ...typography.button, color: colors.text.secondary },
  modalConfirm: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary[500], alignItems: 'center' },
  modalConfirmText: { ...typography.button, color: colors.text.inverse },
});
