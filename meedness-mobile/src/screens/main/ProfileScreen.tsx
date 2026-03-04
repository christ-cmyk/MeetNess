// Écran Profil - MeedNess React Native

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export function ProfileScreen() {
  const { user, logout } = useAuth();

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

      <View style={styles.placeholder}>
        <Text style={styles.subtitle}>Profil complet — Disponible prochainement</Text>
      </View>

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
    marginBottom: spacing['2xl'],
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
