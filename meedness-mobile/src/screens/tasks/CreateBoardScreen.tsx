// Création tableau — CreateBoardScreen — MeedNess Phase 4

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { useTaskStore } from '../../store/stores/useTaskStore';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
type Nav = NativeStackNavigationProp<any>;

const DEFAULT_COLUMNS = [
  { name: 'Backlog', color: '#6B7280' },
  { name: 'À faire', color: '#3B82F6' },
  { name: 'En cours', color: '#F59E0B' },
  { name: 'En révision', color: '#8B5CF6' },
  { name: 'Terminé', color: '#10B981' },
];

export function CreateBoardScreen() {
  const navigation = useNavigation<Nav>();
  const { createBoard, isLoading } = useTaskStore();
  const { organization } = useOrganizationStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const orgId = organization?.id;
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du tableau est obligatoire.');
      return;
    }
    if (!orgId) {
      Alert.alert('Erreur', 'Organisation non trouvée.');
      return;
    }
    try {
      const board = await createBoard({
        name: name.trim(),
        description: description.trim() || undefined,
        organization_id: orgId,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le tableau.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau tableau</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading || !name.trim()}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={[styles.submitText, !name.trim() && { opacity: 0.4 }]}>Créer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: spacing['6xl'] }}>
        <Text style={styles.label}>Nom du tableau *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Sprint 1, Roadmap Q1..."
          placeholderTextColor={colors.text.tertiary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Décrivez l'objectif de ce tableau..."
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Default columns preview */}
        <Text style={styles.label}>Colonnes par défaut</Text>
        <View style={styles.columnsPreview}>
          {DEFAULT_COLUMNS.map((col, i) => (
            <View key={i} style={styles.columnPreviewItem}>
              <View style={[styles.columnDot, { backgroundColor: col.color }]} />
              <Text style={styles.columnName}>{col.name}</Text>
              {i < DEFAULT_COLUMNS.length - 1 && (
                <Ionicons name="arrow-forward" size={14} color={colors.text.tertiary} style={{ marginLeft: spacing.sm }} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.hint}>
          Ces colonnes seront créées automatiquement. Vous pourrez les personnaliser ensuite.
        </Text>
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
  label: { ...typography.label, color: colors.text.primary, marginBottom: spacing.sm, marginTop: spacing.xl },
  input: {
    ...typography.body, color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  textarea: { minHeight: 80 },
  columnsPreview: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    backgroundColor: colors.background.primary,
    padding: spacing.lg, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border.light,
  },
  columnPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  columnDot: { width: 10, height: 10, borderRadius: 5 },
  columnName: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '500' },
  hint: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.sm },
});
