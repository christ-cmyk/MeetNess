import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/stores/useAuthStore';
import { authAPI } from '../services/api/auth.api';
import type {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  UserRole,
} from '../types/user.types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    needsRoleSelection,
    intentRole,
    error,
    initialize,
    login,
    register,
    logout,
    chooseRole,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      await login(credentials);
    },
    [login]
  );

  const handleRegister = useCallback(
    async (userData: RegisterData) => {
      await register(userData);
    },
    [register]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleForgotPassword = useCallback(
    async (data: ForgotPasswordData) => {
      await authAPI.forgotPassword(data);
    },
    []
  );

  const handleResetPassword = useCallback(
    async (data: ResetPasswordData) => {
      await authAPI.resetPassword(data);
    },
    []
  );

  const handleChooseRole = useCallback(
    async (role: UserRole) => {
      await chooseRole(role);
    },
    [chooseRole]
  );

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authAPI.getUserProfile();
      useAuthStore.getState().setUser(profile);
      return profile;
    } catch (error) {
      console.error('Erreur rafraîchissement profil:', error);
      throw error;
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    needsRoleSelection,
    intentRole,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    chooseRole: handleChooseRole,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    refreshProfile,
    clearError,
  };
}