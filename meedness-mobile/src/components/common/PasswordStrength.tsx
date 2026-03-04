// Composant PasswordStrength pour MeedNess - React Native
// Source: src/components/auth/PasswordStrength.tsx (adapté)

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

function calculateStrength(password: string): StrengthResult {
  let score = 0;

  if (!password) {
    return { score: 0, label: '', color: colors.neutral[300] };
  }

  // Longueur
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Minuscules
  if (/[a-z]/.test(password)) score += 1;

  // Majuscules
  if (/[A-Z]/.test(password)) score += 1;

  // Chiffres
  if (/\d/.test(password)) score += 1;

  // Caractères spéciaux
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Déterminer le niveau
  if (score <= 2) {
    return { score, label: 'Faible', color: colors.error };
  } else if (score <= 4) {
    return { score, label: 'Moyen', color: colors.warning };
  } else {
    return { score, label: 'Fort', color: colors.success };
  }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  const maxScore = 6;
  const filledSegments = Math.ceil((strength.score / maxScore) * 4);

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((segment) => (
          <View
            key={segment}
            style={[
              styles.bar,
              {
                backgroundColor:
                  segment <= filledSegments ? strength.color : colors.neutral[200],
              },
            ]}
          />
        ))}
      </View>
      
      <Text style={[styles.label, { color: strength.color }]}>
        Force du mot de passe : {strength.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },

  barsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },

  bar: {
    flex: 1,
    height: 6,
    borderRadius: borderRadius.full,
  },

  label: {
    ...typography.caption,
    fontWeight: '500',
  },
});
