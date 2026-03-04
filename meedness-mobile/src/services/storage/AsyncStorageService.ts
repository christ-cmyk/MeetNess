/**
 * Service de stockage pour MeedNess - React Native
 * Gère le stockage sécurisé (SecureStore) et normal (AsyncStorage)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  /**
   * Stocke un élément de manière sécurisée (pour les tokens)
   * IMPORTANT : SecureStore n'accepte que des STRINGS
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      // Vérifier que value est bien une string
      if (typeof value !== 'string') {
        console.error(`❌ [SecureStore] La valeur pour "${key}" n'est pas une string:`, typeof value);
        throw new Error(`SecureStore n'accepte que des strings. Reçu: ${typeof value}`);
      }

      await SecureStore.setItemAsync(key, value);
      console.log(`✅ [SecureStore] ${key} stocké avec succès`);
    } catch (error) {
      console.error(`❌ [SecureStore] Erreur stockage ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un élément sécurisé
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        console.log(`✅ [SecureStore] ${key} récupéré`);
      }
      return value;
    } catch (error) {
      console.error(`❌ [SecureStore] Erreur récupération ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime un élément sécurisé
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`✅ [SecureStore] ${key} supprimé`);
    } catch (error) {
      console.error(`❌ [SecureStore] Erreur suppression ${key}:`, error);
      throw error;
    }
  }

  /**
   * Stocke un objet JSON dans AsyncStorage (pour l'utilisateur, etc.)
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ [AsyncStorage] ${key} stocké (JSON)`);
    } catch (error) {
      console.error(`❌ [AsyncStorage] Erreur stockage JSON ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un objet JSON depuis AsyncStorage
   */
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (!jsonValue) {
        return null;
      }
      const parsed = JSON.parse(jsonValue) as T;
      console.log(`✅ [AsyncStorage] ${key} récupéré (JSON)`);
      return parsed;
    } catch (error) {
      console.error(`❌ [AsyncStorage] Erreur récupération JSON ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime un élément d'AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ [AsyncStorage] ${key} supprimé`);
    } catch (error) {
      console.error(`❌ [AsyncStorage] Erreur suppression ${key}:`, error);
      throw error;
    }
  }

  /**
   * Vide complètement le stockage (déconnexion totale)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('✅ [AsyncStorage] Tout le stockage vidé');
    } catch (error) {
      console.error('❌ [AsyncStorage] Erreur vidage complet:', error);
      throw error;
    }
  }

  /**
   * Stocke une string simple dans AsyncStorage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`✅ [AsyncStorage] ${key} stocké`);
    } catch (error) {
      console.error(`❌ [AsyncStorage] Erreur stockage ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère une string depuis AsyncStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`✅ [AsyncStorage] ${key} récupéré`);
      }
      return value;
    } catch (error) {
      console.error(`❌ [AsyncStorage] Erreur récupération ${key}:`, error);
      return null;
    }
  }
}

// Export d'une instance unique (Singleton)
export const storageService = new StorageService();

// Export de la classe pour les tests si nécessaire
export default StorageService;