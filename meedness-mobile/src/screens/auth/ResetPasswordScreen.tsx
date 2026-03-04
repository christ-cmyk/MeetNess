// Écran Réinitialisation du mot de passe pour MeedNess - React Native
// Source: src/pages/auth/ResetPassword.tsx (adapté)

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/layout/Screen';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PasswordStrength } from '../../components/common/PasswordStrength';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type ResetPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const { resetPassword } = useAuth();

  // Récupérer le token depuis les params de navigation ou deep link
  const token = route.params?.token || '';

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      Alert.alert('Erreur', 'Token de réinitialisation manquant');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Token manquant
  if (!token) {
    return (
      <Screen
        title="Lien invalide"
        description="Ce lien de réinitialisation n'est pas valide"
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
          </View>

          <Text style={styles.errorText}>
            Le lien de réinitialisation est invalide ou a expiré.
            Veuillez faire une nouvelle demande.
          </Text>

          <Button
            onPress={() => navigation.navigate('ForgotPassword')}
            fullWidth
          >
            Nouvelle demande
          </Button>
        </View>
      </Screen>
    );
  }

  // Écran de succès
  if (isSuccess) {
    return (
      <Screen
        title="Mot de passe modifié !"
        description="Votre mot de passe a été réinitialisé avec succès"
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>

          <Text style={styles.successText}>
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </Text>

          <Button
            onPress={() => navigation.navigate('Login')}
            fullWidth
          >
            Se connecter
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé"
    >
      {/* Password */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <PasswordInput
              label="Nouveau mot de passe"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              autoComplete="password-new"
            />
            <PasswordStrength password={value} />
          </View>
        )}
      />

      {/* Confirm Password */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            autoComplete="password-new"
          />
        )}
      />

      {/* Submit Button */}
      <Button
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
      >
        Réinitialiser le mot de passe
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Error state
  errorContainer: {
    alignItems: 'center',
  },

  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Success state
  successContainer: {
    alignItems: 'center',
  },

  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  successText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
