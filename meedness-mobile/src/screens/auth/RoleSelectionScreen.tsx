// Écran de sélection du rôle - MeedNess React Native
// S'affiche après inscription réussie si needs_role_selection === true

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

import { colors, spacing, typography } from '../../theme';


interface RoleCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  disabled: boolean;
}

function RoleCard({ icon, title, description, onPress, disabled }: RoleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.roleCard, disabled && styles.roleCardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.roleIcon}>{icon}</Text>
      <View style={styles.roleContent}>
        <Text style={styles.roleTitle}>{title}</Text>
        <View style={styles.roleDivider} />
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
      <View style={styles.roleButton}>
        <Text style={styles.roleButtonText}>Choisir ce rôle</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RoleSelectionScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { chooseRole } = useAuth();

const handleRoleSelection = async (role: 'admin' | 'member') => {
    setIsLoading(true);
    try {
      await chooseRole(role);
      // AppNavigator détecte isAuthenticated: true et redirige automatiquement
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de définir le rôle'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Inscription Réussie !</Text>
        <Text style={styles.subtitle}>
          Comment souhaitez-vous utiliser MeedNess ?
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <RoleCard
          icon="👔"
          title="Administrateur"
          description="Je crée et gère une organisation (entreprise ou famille)"
          onPress={() => handleRoleSelection('admin')}
          disabled={isLoading}
        />

        <RoleCard
          icon="👤"
          title="Membre"
          description="Je rejoins une organisation existante (via invitation)"
          onPress={() => handleRoleSelection('member')}
          disabled={isLoading}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Configuration en cours...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },

  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  cardsContainer: {
    gap: spacing.lg,
  },

  roleCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  roleCardDisabled: {
    opacity: 0.6,
  },

  roleIcon: {
    fontSize: 36,
    marginBottom: spacing.md,
  },

  roleContent: {
    marginBottom: spacing.lg,
  },

  roleTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  roleDivider: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginBottom: spacing.sm,
  },

  roleDescription: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  roleButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  roleButtonText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  loadingOverlay: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  loadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
