// Détail tâche — TaskDetailScreen — MeedNess Phase 4

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { useTaskStore } from '../../store/stores/useTaskStore';
import { useAuthStore } from '../../store/stores/useAuthStore';
import { taskAPI } from '../../services/api/task.api';
import type { Task, TaskComment, TaskActivity, TaskPriority } from '../../types/task';

type Nav = NativeStackNavigationProp<any>;

const PRIORITY_LABELS: Record<TaskPriority, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: '#EF4444' },
  high: { label: 'Haute', color: '#F59E0B' },
  medium: { label: 'Moyenne', color: '#3B82F6' },
  low: { label: 'Faible', color: '#6B7280' },
};

export function TaskDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { taskId } = route.params || {};
  const user = useAuthStore((s) => s.user);
  const { addSubTask, toggleSubTask, archiveTask } = useTaskStore();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showActivity, setShowActivity] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, c, a] = await Promise.all([
        taskAPI.getTaskDetail(taskId),
        taskAPI.getComments(taskId),
        taskAPI.getActivity(taskId),
      ]);
      setTask(t);
      setComments(c);
      setActivity(a);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const c = await taskAPI.addComment(taskId, commentText.trim());
      setComments((prev) => [...prev, c]);
      setCommentText('');
    } catch {}
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      await addSubTask(taskId, newSubtask.trim());
      setNewSubtask('');
      load();
    } catch {}
  };

  const handleToggleSubtask = async (subId: string) => {
    await toggleSubTask(taskId, subId);
    load();
  };

  const handleArchive = () => {
    Alert.alert('Archiver', 'Archiver cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver', style: 'destructive',
        onPress: async () => {
          await archiveTask(taskId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const priority = PRIORITY_LABELS[task.priority];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Détail tâche</Text>
        <TouchableOpacity onPress={handleArchive}>
          <Ionicons name="archive-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: spacing['6xl'] }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Priority & Status */}
        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: priority.color + '20' }]}>
            <View style={[styles.dot, { backgroundColor: priority.color }]} />
            <Text style={[styles.chipText, { color: priority.color }]}>{priority.label}</Text>
          </View>
          {task.is_overdue && (
            <View style={[styles.chip, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={[styles.chipText, { color: '#EF4444' }]}>En retard</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {task.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText}>{task.description}</Text>
          </View>
        ) : null}

        {/* Assignees */}
        {task.assigned_to.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignés</Text>
            <View style={styles.assigneeRow}>
              {task.assigned_to.map((a) => (
                <View key={a.id} style={styles.assignee}>
                  <View style={styles.assigneeAvatar}>
                    <Text style={styles.assigneeAvatarText}>{a.username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.assigneeName}>{a.full_name || a.username}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Labels</Text>
            <View style={styles.labelsRow}>
              {task.labels.map((l) => (
                <View key={l.id} style={[styles.labelChip, { backgroundColor: l.color + '20' }]}>
                  <View style={[styles.dot, { backgroundColor: l.color }]} />
                  <Text style={[styles.labelChipText, { color: l.color }]}>{l.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Due date & hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailGrid}>
            {task.due_date && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}</Text>
              </View>
            )}
            {task.estimated_hours != null && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>Estimé : {task.estimated_hours}h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subtasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Sous-tâches ({task.subtasks.filter((s) => s.is_done).length}/{task.subtasks.length})
            </Text>
          </View>
          {task.subtasks.length > 0 && (
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
              </View>
              <Text style={styles.progressPct}>{task.progress}%</Text>
            </View>
          )}
          {task.subtasks.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subtaskItem}
              onPress={() => handleToggleSubtask(sub.id)}
            >
              <Ionicons
                name={sub.is_done ? 'checkbox' : 'square-outline'}
                size={20}
                color={sub.is_done ? colors.success : colors.text.tertiary}
              />
              <Text style={[styles.subtaskText, sub.is_done && styles.subtaskDone]}>
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.addSubRow}>
            <TextInput
              style={styles.addSubInput}
              placeholder="Ajouter une sous-tâche..."
              placeholderTextColor={colors.text.tertiary}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
            />
            <TouchableOpacity onPress={handleAddSubtask} disabled={!newSubtask.trim()}>
              <Ionicons name="add-circle" size={28} color={newSubtask.trim() ? colors.primary[500] : colors.neutral[300]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commentaires ({comments.length})</Text>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{c.author.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentAuthor}>{c.author.full_name || c.author.username}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentContent}>
                {c.is_deleted ? 'Ce commentaire a été supprimé.' : c.content}
              </Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={colors.text.tertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
              <Ionicons name="send" size={22} color={commentText.trim() ? colors.primary[500] : colors.neutral[300]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity toggle */}
        <TouchableOpacity style={styles.activityToggle} onPress={() => setShowActivity(!showActivity)}>
          <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.activityToggleText}>
            {showActivity ? 'Masquer l\'historique' : 'Voir l\'historique'}
          </Text>
          <Ionicons name={showActivity ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.secondary} />
        </TouchableOpacity>

        {showActivity && activity.map((a) => (
          <View key={a.id} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText}>
                <Text style={{ fontWeight: '600' }}>{a.user.username}</Text> {a.action}
              </Text>
              <Text style={styles.activityDate}>
                {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing['4xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h4, color: colors.text.primary, flex: 1 },
  scroll: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { ...typography.caption, fontWeight: '600' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.text.primary, marginBottom: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  descText: { ...typography.body, color: colors.text.secondary },
  assigneeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.neutral[100], paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg },
  assigneeAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  assigneeAvatarText: { fontSize: 12, fontWeight: '600', color: colors.primary[700] },
  assigneeName: { ...typography.bodySmall, color: colors.text.primary },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm },
  labelChipText: { ...typography.caption, fontWeight: '600' },
  detailGrid: { gap: spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { ...typography.bodySmall, color: colors.text.secondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.neutral[200], borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
  progressPct: { ...typography.caption, color: colors.text.secondary, width: 36, textAlign: 'right' },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  subtaskText: { ...typography.bodySmall, color: colors.text.primary, flex: 1 },
  subtaskDone: { textDecorationLine: 'line-through', color: colors.text.tertiary },
  addSubRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addSubInput: {
    flex: 1, ...typography.bodySmall, color: colors.text.primary,
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  commentCard: {
    backgroundColor: colors.background.primary, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border.light,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { fontSize: 12, fontWeight: '600', color: colors.primary[700] },
  commentAuthor: { ...typography.labelSmall, color: colors.text.primary },
  commentDate: { ...typography.caption, color: colors.text.tertiary },
  commentContent: { ...typography.bodySmall, color: colors.text.secondary },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  commentInput: { flex: 1, ...typography.bodySmall, color: colors.text.primary, maxHeight: 80 },
  activityToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  activityToggleText: { ...typography.bodySmall, color: colors.text.secondary, flex: 1 },
  activityItem: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, paddingLeft: spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[300], marginTop: 6 },
  activityText: { ...typography.bodySmall, color: colors.text.secondary },
  activityDate: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
});
