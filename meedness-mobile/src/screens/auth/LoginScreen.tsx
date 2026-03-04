// Écran de connexion pour MeedNess - React Native
// Source: src/pages/auth/Login.tsx (adapté)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatApiError } from '../../utils/errorHandler';

import { loginSchema, type LoginFormData } from '../../utils/validation';
import { colors, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<LoginNavigationProp>();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login({
        email: data.email,
        password: data.password,
      });
      // La navigation vers l'écran principal se fait automatiquement
      // via le AuthNavigator quand isAuthenticated devient true
} catch (error) {
  const errorMessage = formatApiError(error);
  Alert.alert('Erreur de connexion', errorMessage);
} finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      title="Connexion"
      description="Connectez-vous à votre compte MeedNess"
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

      {/* Password Input */}
      <View style={styles.passwordContainer}>
        <View style={styles.passwordHeader}>
          <Text style={styles.label}>Mot de passe</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>
        
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              autoComplete="password"
            />
          )}
        />
      </View>

      {/* Submit Button */}
      <Button
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
      >
        Se connecter
      </Button>

      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    marginBottom: spacing.lg,
  },

  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  label: {
    ...typography.label,
    color: colors.text.primary,
  },

  forgotLink: {
    ...typography.bodySmall,
    color: colors.primary[500],
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },

  registerText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  registerLink: {
    ...typography.body,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
