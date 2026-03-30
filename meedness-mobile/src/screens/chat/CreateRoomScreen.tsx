// Écran création de salon de chat - MeedNess React Native (Version Finale)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useChatStore } from '../../store/stores/useChatStore';
import { useOrganizationStore } from '../../store/stores/useOrganizationStore';
import { Input } from '../../components/common/Input';
import type { RoomType } from '../../types/chat';

const createRoomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').min(2, 'Minimum 2 caractères').max(50, 'Maximum 50 caractères'),
  type: z.enum(['general', 'team', 'announcement'] as const),
});

const ROOM_TYPES: { value: RoomType; label: string; icon: string; description: string }[] = [
  { value: 'general', label: 'Général', icon: 'globe', description: 'Salon ouvert à tous' },
  { value: 'team', label: 'Équipe', icon: 'people', description: "Lié à une équipe" },
  { value: 'announcement', label: 'Annonce', icon: 'megaphone', description: 'Seuls les admins écrivent' },
];

export function CreateRoomScreen() {
  const navigation = useNavigation();
  const { createRoom, isLoading } = useChatStore();
  const { teams } = useOrganizationStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('general');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const result = createRoomSchema.safeParse({ name, type });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    try {
      await createRoom({
        name,
        type,
        team_id: type === 'team' ? selectedTeamId : undefined,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer le salon');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau salon</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Nom du salon"
          placeholder="Ex: Marketing, Projet Alpha..."
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((e) => ({ ...e, name: '' }));
          }}
          error={errors.name}
          leftIcon={<Ionicons name="chatbubble-outline" size={20} color={colors.text.tertiary} />}
        />

        <Text style={styles.sectionLabel}>Type de salon</Text>
        <View style={styles.typeContainer}>
          {ROOM_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt.value}
              style={[styles.typeCard, type === rt.value && styles.typeCardActive]}
              onPress={() => setType(rt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.typeIcon, type === rt.value && styles.typeIconActive]}>
                <Ionicons
                  name={rt.icon as any}
                  size={24}
                  color={type === rt.value ? colors.primary[500] : colors.text.tertiary}
                />
              </View>
              <Text style={[styles.typeLabel, type === rt.value && styles.typeLabelActive]}>
                {rt.label}
              </Text>
              <Text style={styles.typeDescription}>{rt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'team' && teams.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Équipe</Text>
            <View style={styles.teamContainer}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamChip, selectedTeamId === team.id && styles.teamChipActive]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <Text style={[styles.teamChipText, selectedTeamId === team.id && styles.teamChipTextActive]}>
                    {team.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={colors.text.inverse} />
              <Text style={styles.createButtonText}>Créer le salon</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing['5xl'], paddingBottom: spacing.md,
    backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  content: { flex: 1, padding: spacing.xl },
  sectionLabel: { ...typography.label, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.sm },
  typeContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  typeCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.border.light, alignItems: 'center' },
  typeCardActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  typeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background.tertiary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  typeIconActive: { backgroundColor: colors.primary[100] },
  typeLabel: { ...typography.label, color: colors.text.primary, marginBottom: 2, fontSize: 13 },
  typeLabelActive: { color: colors.primary[600] },
  typeDescription: { ...typography.caption, color: colors.text.secondary, textAlign: 'center', fontSize: 10 },
  teamContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  teamChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.background.secondary },
  teamChipActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  teamChipText: { ...typography.bodySmall, color: colors.text.secondary },
  teamChipTextActive: { color: colors.primary[600], fontWeight: '600' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[500], paddingVertical: spacing.lg, borderRadius: borderRadius.lg, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing['4xl'] },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { ...typography.button, color: colors.text.inverse },
});
