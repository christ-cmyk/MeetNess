// Écran Mot de passe oublié pour MeedNess - React Native
// Source: src/pages/auth/ForgotPassword.tsx (adapté)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { forgotPassword } = useAuth();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword({ email: data.email });
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

  // Écran de succès
  if (isSuccess) {
    return (
      <Screen
        title="Email envoyé !"
        description="Vérifiez votre boîte de réception"
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="mail" size={48} color={colors.primary[500]} />
          </View>
          
          <Text style={styles.successText}>
            Si un compte existe avec l'adresse{' '}
            <Text style={styles.emailHighlight}>{getValues('email')}</Text>,
            vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </Text>

          <Text style={styles.spamNote}>
            N'oubliez pas de vérifier vos spams si vous ne trouvez pas l'email.
          </Text>

          <Button
            onPress={() => navigation.navigate('Login')}
            fullWidth
          >
            Retour à la connexion
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Mot de passe oublié ?"
      description="Entrez votre email pour recevoir un lien de réinitialisation"
    >
      {/* Email Input */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={
              <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} />
            }
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
        Envoyer le lien
      </Button>

      {/* Back to Login */}
      <TouchableOpacity
        style={styles.backContainer}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
        <Text style={styles.backText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Success state
  successContainer: {
    alignItems: 'center',
  },

  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  successText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  emailHighlight: {
    fontWeight: '600',
    color: colors.text.primary,
  },

  spamNote: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Back link
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },

  backText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
