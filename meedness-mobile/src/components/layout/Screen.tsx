// Composant Screen (layout générique) pour MeedNess - React Native
// Source: src/components/auth/AuthLayout.tsx (adapté)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showLogo?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
}

export function Screen({
  children,
  title,
  description,
  showLogo = true,
  scrollable = true,
  keyboardAvoiding = true,
}: ScreenProps) {
  const content = (
    <>
      {/* Logo */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.authGradient.start, colors.authGradient.end]}
            style={styles.logoBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>M</Text>
          </LinearGradient>
          <Text style={styles.brandName}>MeedNess</Text>
        </View>
      )}

      {/* Card principale */}
      <View style={styles.card}>
        {/* Header */}
        {(title || description) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2024 MeedNess. Tous droits réservés.</Text>
    </>
  );

  const wrappedContent = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>{content}</View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.secondary} />
      
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {wrappedContent}
        </KeyboardAvoidingView>
      ) : (
        wrappedContent
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.inverse,
  },

  brandName: {
    ...typography.h3,
    color: colors.text.primary,
  },

  // Card
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Content
  content: {
    // Le contenu du formulaire
  },

  // Footer
  footer: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
