// Service d'authentification pour MeedNess - React Native

import apiClient from './client';
import { storageService } from '../storage/AsyncStorageService';
import { AUTH_ENDPOINTS, STORAGE_KEYS } from '../../config/env';
import type {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
  ChooseRoleResponse,
  User,
  UserRole,
} from '../../types/user.types';

class AuthAPI {
  // Récupère le token d'accès
  async getAccessToken(): Promise<string | null> {
    return storageService.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  // Récupère le token de rafraîchissement
  async getRefreshToken(): Promise<string | null> {
    return storageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Récupère l'utilisateur stocké
  async getStoredUser(): Promise<User | null> {
    return storageService.getJSON<User>(STORAGE_KEYS.USER);
  }

  // Vérifie si l'utilisateur est authentifié
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Stocke les tokens après authentification
private async storeAuthData(response: AuthResponse): Promise<void> {
  // 🔍 DEBUG
  console.log('📦 Response reçue:', response);
  console.log('🔑 Tokens:', response.tokens);
  
  await Promise.all([
    storageService.setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, response.tokens.access),   // ← Changé
    storageService.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, response.tokens.refresh), // ← Changé
    storageService.setJSON(STORAGE_KEYS.USER, response.user),
  ]);
}
  // Nettoie les données d'authentification
  async clearAuthData(): Promise<void> {
    await Promise.all([
      storageService.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      storageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      storageService.removeItem(STORAGE_KEYS.USER),
    ]);
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );

    await this.storeAuthData(response.data);
    return response.data;
  }

  // Inscription - retourne needs_role_selection
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { confirmPassword, ...dataToSend } = userData;

    const response = await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER,
      {
        username: dataToSend.username,
        email: dataToSend.email,
        password: dataToSend.password,
        password_confirm: dataToSend.password_confirm,
        phone: dataToSend.phone,
        country: dataToSend.country,
      }
    );

    await this.storeAuthData(response.data);
    return response.data;
  }

  // Choix du rôle après inscription
  async chooseRole(role: UserRole): Promise<ChooseRoleResponse> {
    const response = await apiClient.post<ChooseRoleResponse>(
      AUTH_ENDPOINTS.CHOOSE_ROLE,
      { role }
    );

    // Mettre à jour l'utilisateur stocké avec le rôle
    await storageService.setJSON(STORAGE_KEYS.USER, response.data.user);
    return response.data;
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  // Demande de réinitialisation de mot de passe
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.PASSWORD_RESET, data);
  }

  // Réinitialisation du mot de passe
  async resetPassword(data: ResetPasswordData): Promise<void> {
    const { confirmPassword, ...dataToSend } = data;
    await apiClient.post(AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM, dataToSend);
  }

  // Récupère le profil utilisateur (avec rôle)
  async getUserProfile(): Promise<User> {
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.USER_PROFILE);
    await storageService.setJSON(STORAGE_KEYS.USER, response.data);
    return response.data;
  }
}

export const authAPI = new AuthAPI();
