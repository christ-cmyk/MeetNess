// Écran de création d'organisation (admin) - MeedNess React Native

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import type { OrganizationType } from '../../types/organization';

const ORG_TYPES: { value: OrganizationType; label: string; icon: string; description: string }[] = [
  { value: 'company', label: 'Entreprise', icon: 'business', description: 'Pour votre entreprise ou startup' },
  { value: 'family', label: 'Famille', icon: 'people', description: 'Pour votre cercle familial' },
  { value: 'team', label: 'Équipe', icon: 'shield', description: 'Pour votre équipe ou club' },
];

export  function CreateOrganizationScreen() {
  const { createOrganization, isLoading, error, clearError } = useOrganizationStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<OrganizationType>('company');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = async () => {
    clearError();
    setNameError('');

    if (!name.trim()) {
      setNameError("Le nom de l'organisation est requis");
      return;
    }
    if (name.trim().length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    try {
      await createOrganization({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      // La navigation sera gérée par AppNavigator via le store
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={48} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>Créer votre organisation</Text>
          <Text style={styles.subtitle}>
            Configurez l'espace de travail pour votre équipe
          </Text>
        </View>

        {/* Nom */}
        <View style={styles.field}>
          <Text style={styles.label}>Nom de l'organisation *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            placeholder="Ex: Mon Entreprise"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Type d'organisation</Text>
          <View style={styles.typeContainer}>
            {ORG_TYPES.map((orgType) => (
              <TouchableOpacity
                key={orgType.value}
                style={[
                  styles.typeCard,
                  type === orgType.value && styles.typeCardActive,
                ]}
                onPress={() => setType(orgType.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={orgType.icon as any}
                  size={28}
                  color={type === orgType.value ? colors.primary[500] : colors.text.tertiary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    type === orgType.value && styles.typeLabelActive,
                  ]}
                >
                  {orgType.label}
                </Text>
                <Text style={styles.typeDescription}>{orgType.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre organisation..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Erreur API */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Button onPress={handleSubmit} loading={isLoading} fullWidth>
          Créer mon organisation
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.secondary },
  container: {
    padding: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  field: {
    marginBottom: spacing['2xl'],
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
  },
  typeContainer: {
    gap: spacing.md,
  },
  typeCard: {
    backgroundColor: colors.background.primary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  typeLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  typeLabelActive: {
    color: colors.primary[700],
  },
  typeDescription: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
});
