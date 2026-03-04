// Écran d'attente d'invitation (member) - MeedNess React Native

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import type { Invitation } from '../../types/organization';

export function WaitingInvitationScreen() {
  const { logout } = useAuth();
  const {
    pendingInvitations,
    isLoading,
    checkPendingInvitations,
    acceptInvitation,
  } = useOrganizationStore();

  const [accepting, setAccepting] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Vérification initiale + auto-refresh toutes les 30s
  useEffect(() => {
    checkPendingInvitations();
    intervalRef.current = setInterval(() => {
      checkPendingInvitations();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkPendingInvitations]);

  const handleAccept = async (invitation: Invitation) => {
    try {
      setAccepting(invitation.id);
      await acceptInvitation(invitation.id);
      // La navigation sera gérée par AppNavigator via le store
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setAccepting(null);
    }
  };

  const renderInvitation = ({ item }: { item: Invitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationInfo}>
        <Text style={styles.orgName}>{item.organization.name}</Text>
        <Text style={styles.orgType}>
          {item.organization.type === 'company' ? 'Entreprise' :
           item.organization.type === 'family' ? 'Famille' : 'Équipe'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAccept(item)}
        disabled={accepting === item.id}
      >
        {accepting === item.id ? (
          <ActivityIndicator size="small" color={colors.background.primary} />
        ) : (
          <Text style={styles.acceptText}>Rejoindre</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>📨</Text>
        <Text style={styles.title}>En attente d'invitation</Text>
        <Text style={styles.subtitle}>
          Un administrateur doit vous inviter dans son organisation. Vérifiez votre email.
        </Text>
      </View>

      {/* Invitations */}
      {pendingInvitations.length > 0 ? (
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Invitations reçues</Text>
          <FlatList
            data={pendingInvitations}
            renderItem={renderInvitation}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          onPress={() => checkPendingInvitations()}
          loading={isLoading}
          fullWidth
        >
          Vérifier mes invitations
        </Button>

        <Button onPress={logout} variant="outline" fullWidth>
          Se déconnecter
        </Button>
      </View>

      {/* Auto-refresh indicator */}
      <Text style={styles.refreshNote}>
        Rafraîchissement automatique toutes les 30 secondes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
    paddingTop: spacing['5xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  invitationInfo: {
    flex: 1,
  },
  orgName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orgType: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  acceptButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  acceptText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
  refreshNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
