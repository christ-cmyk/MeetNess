// Création tâche — CreateTaskScreen — MeedNess Phase 4

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { useTaskStore } from '../../store/stores/useTaskStore';
import { useAuthStore } from '../../store/stores/useAuthStore';
import { taskAPI } from '../../services/api/task.api';
import type { TaskPriority, TaskLabel } from '../../types/task';

type Nav = NativeStackNavigationProp<any>;

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Faible', color: '#6B7280' },
  { value: 'medium', label: 'Moyenne', color: '#3B82F6' },
  { value: 'high', label: 'Haute', color: '#F59E0B' },
  { value: 'urgent', label: 'Urgente', color: '#EF4444' },
];

export function CreateTaskScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { boardId, columnId } = route.params || {};
  const { createTask, activeBoard, isLoading } = useTaskStore();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedColumn, setSelectedColumn] = useState(columnId || '');
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');

  const columns = activeBoard?.columns?.sort((a, b) => a.order - b.order) || [];

  useEffect(() => {
    const orgId = (user as any)?.organization_id || (user as any)?.organization?.id;
    if (orgId) {
      taskAPI.getLabels(orgId).then(setLabels).catch(() => {});
    }
    if (!selectedColumn && columns.length > 0) {
      setSelectedColumn(columns[0].id);
    }
  }, []);

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const formatDisplayDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDueDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return;
    }
    if (!selectedColumn) {
      Alert.alert('Erreur', 'Sélectionnez une colonne.');
      return;
    }
    try {
      await createTask(boardId, {
        title: title.trim(),
        description: description.trim() || undefined,
        column_id: selectedColumn,
        priority,
        label_ids: selectedLabels.length > 0 ? selectedLabels : undefined,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la tâche.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle tâche</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading || !title.trim()}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={[styles.submitText, !title.trim() && { opacity: 0.4 }]}>Créer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: spacing['6xl'] }}>
        {/* Title */}
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre de la tâche"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Décrivez la tâche..."
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Column */}
        <Text style={styles.label}>Colonne</Text>
        <View style={styles.optionsRow}>
          {columns.map((col) => (
            <TouchableOpacity
              key={col.id}
              style={[
                styles.optionChip,
                selectedColumn === col.id && { backgroundColor: col.color + '20', borderColor: col.color },
              ]}
              onPress={() => setSelectedColumn(col.id)}
            >
              <View style={[styles.optionDot, { backgroundColor: col.color }]} />
              <Text style={[
                styles.optionText,
                selectedColumn === col.id && { color: col.color, fontWeight: '600' },
              ]}>
                {col.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text style={styles.label}>Priorité</Text>
        <View style={styles.optionsRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.optionChip,
                priority === p.value && { backgroundColor: p.color + '20', borderColor: p.color },
              ]}
              onPress={() => setPriority(p.value)}
            >
              <View style={[styles.optionDot, { backgroundColor: p.color }]} />
              <Text style={[
                styles.optionText,
                priority === p.value && { color: p.color, fontWeight: '600' },
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Labels */}
        {labels.length > 0 && (
          <>
            <Text style={styles.label}>Labels</Text>
            <View style={styles.optionsRow}>
              {labels.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.optionChip,
                    selectedLabels.includes(l.id) && { backgroundColor: l.color + '20', borderColor: l.color },
                  ]}
                  onPress={() => toggleLabel(l.id)}
                >
                  <View style={[styles.optionDot, { backgroundColor: l.color }]} />
                  <Text style={[
                    styles.optionText,
                    selectedLabels.includes(l.id) && { color: l.color, fontWeight: '600' },
                  ]}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Due date */}
        <Text style={styles.label}>Date d'échéance</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={dueDate ? colors.primary[500] : colors.text.tertiary} />
            <Text style={[styles.dateText, !dueDate && { color: colors.text.tertiary }]}>
              {dueDate ? formatDisplayDate(dueDate) : 'Choisir une date'}
            </Text>
          </TouchableOpacity>
          {dueDate && (
            <TouchableOpacity style={styles.dateClear} onPress={() => setDueDate(null)}>
              <Ionicons name="close-circle" size={22} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* Estimated hours */}
        <Text style={styles.label}>Heures estimées</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 4"
          placeholderTextColor={colors.text.tertiary}
          value={estimatedHours}
          onChangeText={setEstimatedHours}
          keyboardType="numeric"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing['4xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h4, color: colors.text.primary },
  submitText: { ...typography.button, color: colors.primary[500] },
  form: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  label: { ...typography.label, color: colors.text.primary, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: {
    ...typography.body, color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
  },
  optionDot: { width: 8, height: 8, borderRadius: 4 },
  optionText: { ...typography.bodySmall, color: colors.text.secondary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateText: { ...typography.body, color: colors.text.primary },
  dateClear: { padding: spacing.xs },
});
