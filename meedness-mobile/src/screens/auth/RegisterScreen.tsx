// Écran d'inscription pour MeedNess - React Native

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatApiError } from '../../utils/errorHandler';
import { Screen } from '../../components/layout/Screen';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PasswordStrength } from '../../components/common/PasswordStrength';
import { CountryPicker } from '../../components/common/CountryPicker';
import { Button } from '../../components/common/Button';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/stores/useAuthStore';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuthStore();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      country: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        username: data.username,
        email: data.email,
        phone: data.phone,
        country: data.country,
        password: data.password,
        password_confirm: data.confirmPassword,
      };
      console.log('📤 Payload envoyé:', payload);
      await register(payload);
      // AppNavigator gère la navigation automatiquement
    } catch (error) {
      const errorMessage = formatApiError(error);
      Alert.alert("Erreur d'inscription", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      title="Créer un compte"
      description="Rejoignez MeedNess dès maintenant"
    >
      {/* Username */}
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Nom d'utilisateur"
            placeholder="ychrist"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.username?.message}
            autoCapitalize="none"
            autoComplete="username"
            leftIcon={
              <Ionicons name="person-outline" size={20} color={colors.text.tertiary} />
            }
          />
        )}
      />

      {/* Email */}
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

      {/* Phone */}
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Numéro de téléphone"
            placeholder="+225 0x xx xx xx xx"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            keyboardType="phone-pad"
            autoComplete="tel"
            leftIcon={
              <Ionicons name="call-outline" size={20} color={colors.text.tertiary} />
            }
          />
        )}
      />

      {/* Country */}
      <Controller
        control={control}
        name="country"
        render={({ field: { onChange, value } }) => (
          <CountryPicker
            label="Pays de résidence"
            value={value}
            onValueChange={onChange}
            error={errors.country?.message}
          />
        )}
      />

      {/* Password */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <PasswordInput
              label="Mot de passe"
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
        Créer mon compte
      </Button>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Déjà inscrit ? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLink: {
    ...typography.body,
    color: colors.primary[500],
    fontWeight: '600',
  },
});