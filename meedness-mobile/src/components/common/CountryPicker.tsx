// Composant CountryPicker pour MeedNess - React Native
// Source: src/components/auth/CountrySelect.tsx (adapté)

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

// Liste des pays avec codes ISO
const countries = [
  { code: 'FR', name: 'France', phone: '+33' },
  { code: 'BE', name: 'Belgique', phone: '+32' },
  { code: 'CH', name: 'Suisse', phone: '+41' },
  { code: 'CA', name: 'Canada', phone: '+1' },
  { code: 'LU', name: 'Luxembourg', phone: '+352' },
  { code: 'MC', name: 'Monaco', phone: '+377' },
  { code: 'SN', name: 'Sénégal', phone: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", phone: '+225' },
  { code: 'CM', name: 'Cameroun', phone: '+237' },
  { code: 'MA', name: 'Maroc', phone: '+212' },
  { code: 'TN', name: 'Tunisie', phone: '+216' },
  { code: 'DZ', name: 'Algérie', phone: '+213' },
  { code: 'ML', name: 'Mali', phone: '+223' },
  { code: 'BF', name: 'Burkina Faso', phone: '+226' },
  { code: 'NE', name: 'Niger', phone: '+227' },
  { code: 'BJ', name: 'Bénin', phone: '+229' },
  { code: 'TG', name: 'Togo', phone: '+228' },
  { code: 'GA', name: 'Gabon', phone: '+241' },
  { code: 'CG', name: 'Congo', phone: '+242' },
  { code: 'CD', name: 'RD Congo', phone: '+243' },
  { code: 'MG', name: 'Madagascar', phone: '+261' },
  { code: 'MU', name: 'Maurice', phone: '+230' },
  { code: 'DE', name: 'Allemagne', phone: '+49' },
  { code: 'ES', name: 'Espagne', phone: '+34' },
  { code: 'IT', name: 'Italie', phone: '+39' },
  { code: 'PT', name: 'Portugal', phone: '+351' },
  { code: 'GB', name: 'Royaume-Uni', phone: '+44' },
  { code: 'US', name: 'États-Unis', phone: '+1' },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

interface CountryPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export function CountryPicker({
  value,
  onValueChange,
  placeholder = 'Sélectionnez un pays',
  label,
  error,
}: CountryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = countries.find((c) => c.code === value);
  const hasError = !!error;

  const handleSelect = (countryCode: string) => {
    onValueChange?.(countryCode);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selector, hasError && styles.selectorError]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedCountry && styles.placeholderText,
          ]}
        >
          {selectedCountry
            ? `${selectedCountry.name} (${selectedCountry.phone})`
            : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionnez un pays</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  item.code === value && styles.countryItemSelected,
                ]}
                onPress={() => handleSelect(item.code)}
              >
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryPhone}>{item.phone}</Text>
                </View>
                {item.code === value && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export { countries };

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },

  selectorError: {
    borderColor: colors.error,
  },

  selectorText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },

  placeholderText: {
    color: colors.text.tertiary,
  },

  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  modalTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },

  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  countryItemSelected: {
    backgroundColor: colors.primary[50],
  },

  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  countryName: {
    ...typography.body,
    color: colors.text.primary,
  },

  countryPhone: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.lg,
  },
});
