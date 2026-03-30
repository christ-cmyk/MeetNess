// Écran Profil - MeedNess React Native

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
};

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { organization, myRole } = useOrganizationStore();

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={80} color={colors.primary[500]} />
      </View>
      <Text style={styles.name}>{user?.username || 'Utilisateur'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color={colors.text.tertiary} />
          <Text style={styles.infoText}>{user?.phone || 'Non renseigné'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={20} color={colors.text.tertiary} />
          <Text style={styles.infoText}>{user?.country || 'Non renseigné'}</Text>
        </View>
      </View>

      {organization && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={colors.text.tertiary} />
            <Text style={styles.infoText}>{organization.name}</Text>
          </View>
          {myRole && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={20} color={colors.text.tertiary} />
              <Text style={styles.infoText}>{ROLE_LABELS[myRole] || myRole}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.spacer} />

      <Button onPress={logout} variant="outline" fullWidth>
        Se déconnecter
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    paddingTop: spacing['5xl'],
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.text.primary,
  },
  spacer: {
    flex: 1,
  },
});
