// Création d'un Objectif OKR — MeedNess Phase 5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useGoalStore } from '../../store/stores/useGoalStore';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import type { GoalVisibility } from '../../types/goal';

const VISIBILITY_OPTIONS: { key: GoalVisibility; label: string; icon: string }[] = [
  { key: 'organization', label: 'Organisation', icon: 'business-outline' },
  { key: 'team', label: 'Équipe', icon: 'people-outline' },
  { key: 'private', label: 'Privé', icon: 'lock-closed-outline' },
];

export function CreateGoalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { organization } = useOrganizationStore();
  const { createGoal, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<GoalVisibility>('organization');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }
    if (!endDate) {
      Alert.alert('Erreur', 'La date de fin est obligatoire');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de fin doit être postérieure à la date de début');
      return;
    }
    if (!organization?.id) {
      Alert.alert('Erreur', 'Aucune organisation trouvée');
      return;
    }
    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: toISO(startDate),
        end_date: toISO(endDate),
        visibility,
        organization_id: organization.id,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel objectif</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Augmenter le chiffre d'affaires"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez l'objectif..."
            placeholderTextColor={colors.text.tertiary}
            multiline
          />
        </View>

        {/* Start date */}
        <View style={styles.field}>
          <Text style={styles.label}>Date de début</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (d) setStartDate(d);
              }}
            />
          )}
        </View>

        {/* End date */}
        <View style={styles.field}>
          <Text style={styles.label}>Date de fin *</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
              <Text style={styles.dateText}>
                {endDate ? formatDate(endDate) : 'Choisir une date'}
              </Text>
            </TouchableOpacity>
            {endDate && (
              <TouchableOpacity onPress={() => setEndDate(null)}>
                <Ionicons name="close-circle" size={24} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              minimumDate={startDate}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (d) setEndDate(d);
              }}
            />
          )}
        </View>

        {/* Visibility */}
        <View style={styles.field}>
          <Text style={styles.label}>Visibilité</Text>
          <View style={styles.visRow}>
            {VISIBILITY_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v.key}
                style={[styles.visChip, visibility === v.key && styles.visChipActive]}
                onPress={() => setVisibility(v.key)}
              >
                <Ionicons
                  name={v.icon as any}
                  size={18}
                  color={visibility === v.key ? colors.text.inverse : colors.text.secondary}
                />
                <Text style={[styles.visText, visibility === v.key && styles.visTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Ionicons name="trophy" size={20} color={colors.text.inverse} />
          <Text style={styles.submitText}>
            {isLoading ? 'Création…' : "Créer l'objectif"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  form: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 100 },
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    minHeight: 48,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    minHeight: 48,
  },
  dateText: { ...typography.body, color: colors.text.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  visRow: { flexDirection: 'row', gap: spacing.sm },
  visChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  visChipActive: { backgroundColor: colors.primary[500] },
  visText: { ...typography.labelSmall, color: colors.text.secondary },
  visTextActive: { color: colors.text.inverse },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  submitText: { ...typography.button, color: colors.text.inverse },
});
