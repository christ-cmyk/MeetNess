// Composant Input pour MeedNess - React Native

import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, containerStyle, style, ...props }, ref) => {
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={[styles.inputWrapper, hasError && styles.inputError]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          
          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            placeholderTextColor={colors.text.tertiary}
            {...props}
          />
          
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

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

  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },

  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },

  leftIcon: {
    paddingLeft: spacing.lg,
  },

  rightIcon: {
    paddingRight: spacing.lg,
  },

  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
