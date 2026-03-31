// Vue Kanban — BoardScreen — MeedNess Phase 4

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, Animated, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { useTaskStore } from '../../store/stores/useTaskStore';
import type { Column, Task, TaskPriority } from '../../types/task';

type Nav = NativeStackNavigationProp<any>;

const PRIORITY_CONFIG: Record<TaskPriority, { icon: string; color: string }> = {
  urgent: { icon: 'alert-circle', color: '#EF4444' },
  high: { icon: 'arrow-up', color: '#F59E0B' },
  medium: { icon: 'remove', color: '#3B82F6' },
  low: { icon: 'arrow-down', color: '#6B7280' },
};

const COLUMN_WIDTH = 280;

function formatDueDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}j en retard`, overdue: true };
  if (days === 0) return { text: "Aujourd'hui", overdue: false };
  if (days === 1) return { text: 'Demain', overdue: false };
  return { text: `${d.getDate()}/${d.getMonth() + 1}`, overdue: false };
}

function TaskCard({ task, onPress, onLongPress }: { task: Task; onPress: () => void; onLongPress: () => void }) {
  const priority = PRIORITY_CONFIG[task.priority];
  const due = formatDueDate(task.due_date);

  return (
    <TouchableOpacity
      style={styles.taskCard}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
    >
      {/* Labels */}
      {(task.labels?.length ?? 0) > 0 && (
        <View style={styles.labelsRow}>
          {task.labels.slice(0, 3).map((l) => (
            <View key={l.id} style={[styles.label, { backgroundColor: l.color + '20' }]}>
              <Text style={[styles.labelText, { color: l.color }]}>{l.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Title */}
      <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>

      {/* Subtask progress */}
      {(task.subtasks?.length ?? 0) > 0 && (
        <View style={styles.subtaskRow}>
          <View style={styles.subtaskBg}>
            <View style={[styles.subtaskFill, { width: `${task.progress}%` }]} />
          </View>
          <Text style={styles.subtaskText}>
            {(task.subtasks ?? []).filter((s) => s.is_done).length}/{task.subtasks?.length ?? 0}

          </Text>
        </View>
      )}

      {/* Footer: priority, assignees, due date, comments */}
      <View style={styles.taskFooter}>
        <Ionicons name={priority.icon as any} size={14} color={priority.color} />

        {due && (
          <View style={[styles.dueChip, due.overdue && styles.dueOverdue]}>
            <Ionicons name="calendar-outline" size={12} color={due.overdue ? '#EF4444' : colors.text.secondary} />
            <Text style={[styles.dueText, due.overdue && { color: '#EF4444' }]}>{due.text}</Text>
          </View>
        )}

        {task.comments_count > 0 && (
          <View style={styles.commentChip}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.commentCount}>{task.comments_count}</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Assignee avatars */}
        <View style={styles.avatarsRow}>
          {(task.assigned_to ?? []).slice(0, 3).map((a, i) => (
            <View key={a.id} style={[styles.avatar, { marginLeft: i > 0 ? -8 : 0 }]}>
              <Text style={styles.avatarText}>
                {a.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {(task.assigned_to?.length ?? 0) > 3 && (
            <View style={[styles.avatar, { marginLeft: -8, backgroundColor: colors.neutral[300] }]}>
              <Text style={styles.avatarText}>+{task.assigned_to.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function KanbanColumn({
  column, onTaskPress, onAddTask, onTaskLongPress,
}: {
  column: Column;
  onTaskPress: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onTaskLongPress: (task: Task, columnId: string) => void;
}) {
  const isOverLimit = column.task_limit != null && column.tasks_count > column.task_limit;

  return (
    <View style={[styles.column, { borderTopColor: column.color }]}>
      {/* Column header */}
      <View style={styles.colHeader}>
        <View style={[styles.colDot, { backgroundColor: column.color }]} />
        <Text style={styles.colName} numberOfLines={1}>{column.name}</Text>
        <View style={[styles.colCount, isOverLimit && { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.colCountText, isOverLimit && { color: '#EF4444' }]}>
            {column.tasks_count}
            {column.task_limit != null ? `/${column.task_limit}` : ''}
          </Text>
        </View>
      </View>

      {/* Tasks list */}
      <FlatList
        data={column.tasks.sort((a, b) => a.order - b.order)}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => onTaskPress(item)}
            onLongPress={() => onTaskLongPress(item, column.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      />

      {/* Add task */}
      <TouchableOpacity style={styles.addTaskBtn} onPress={() => onAddTask(column.id)}>
        <Ionicons name="add" size={18} color={colors.primary[500]} />
        <Text style={styles.addTaskText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
}

export function BoardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { boardId, boardName } = route.params || {};
  const { activeBoard, isLoading, fetchTasks, moveTask } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (boardId) fetchTasks(boardId);
  }, [boardId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks(boardId);
    setRefreshing(false);
  }, [boardId]);

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id, taskTitle: task.title });
  };

  const handleAddTask = (columnId: string) => {
    navigation.navigate('CreateTask', { boardId, columnId });
  };

  const handleTaskLongPress = (task: Task, currentColumnId: string) => {
    if (!activeBoard) return;
    const otherColumns = activeBoard.columns.filter((c) => c.id !== currentColumnId);
    if (otherColumns.length === 0) return;

    Alert.alert(
      'Déplacer la tâche',
      `"${task.title}"`,
      [
        ...otherColumns.map((col) => ({
          text: col.name,
          onPress: () => moveTask(task.id, col.id, 0),
        })),
        { text: 'Annuler', style: 'cancel' as const },
      ],
    );
  };

  const columns = activeBoard?.columns?.sort((a, b) => a.order - b.order) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{boardName || 'Tableau'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTask', { boardId })}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Kanban columns - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kanban}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            onTaskPress={handleTaskPress}
            onAddTask={handleAddTask}
            onTaskLongPress={handleTaskLongPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing['4xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...typography.h3, color: colors.text.primary, flex: 1 },
  kanban: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  column: {
    width: COLUMN_WIDTH, backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg, borderTopWidth: 3,
    paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
    maxHeight: '100%',
  },
  colHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  colDot: { width: 10, height: 10, borderRadius: 5 },
  colName: { ...typography.label, color: colors.text.primary, flex: 1 },
  colCount: {
    backgroundColor: colors.neutral[100], borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  colCountText: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  taskCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border.light,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  labelsRow: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm, flexWrap: 'wrap' },
  label: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  labelText: { ...typography.caption, fontWeight: '600', fontSize: 10 },
  taskTitle: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '500' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  subtaskBg: { flex: 1, height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, overflow: 'hidden' },
  subtaskFill: { height: 4, backgroundColor: colors.primary[500], borderRadius: 2 },
  subtaskText: { ...typography.caption, color: colors.text.tertiary },
  taskFooter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
  },
  dueChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dueOverdue: {},
  dueText: { ...typography.caption, color: colors.text.secondary },
  commentChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  commentCount: { ...typography.caption, color: colors.text.tertiary },
  avatarsRow: { flexDirection: 'row' },
  avatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary[100],
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background.primary,
  },
  avatarText: { fontSize: 10, fontWeight: '600', color: colors.primary[700] },
  addTaskBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border.light, borderStyle: 'dashed',
    borderRadius: borderRadius.md, marginTop: spacing.xs,
  },
  addTaskText: { ...typography.caption, color: colors.primary[500], fontWeight: '500' },
});
