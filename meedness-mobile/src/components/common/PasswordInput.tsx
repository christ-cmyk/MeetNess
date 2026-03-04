// Composant PasswordInput pour MeedNess - React Native
// Source: src/components/auth/PasswordInput.tsx (adapté)

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={[styles.inputWrapper, hasError && styles.inputError]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            secureTextEntry={!showPassword}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />
          
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
  },

  inputError: {
    borderColor: colors.error,
  },

  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },

  eyeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
