import { create } from 'zustand';
import { authAPI } from '../../services/api/auth.api';
import type { User, LoginCredentials, RegisterData, UserRole } from '../../types/user.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  needsRoleSelection: boolean;
  intentRole: 'admin' | 'member' | null;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  chooseRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  needsRoleSelection: false,
  intentRole: null,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const [isAuth, user] = await Promise.all([
        authAPI.isAuthenticated(),
        authAPI.getStoredUser(),
      ]);
      set({
        isAuthenticated: isAuth,
        user: isAuth ? user : null,
        isInitialized: true,
        isLoading: false,
        needsRoleSelection: false,
        intentRole: isAuth && user ? user.role : null,
      });
    } catch (error) {
      set({
        isAuthenticated: false,
        user: null,
        isInitialized: true,
        isLoading: false,
        needsRoleSelection: false,
        intentRole: null,
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        needsRoleSelection: false,
        intentRole: response.user.role,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Échec de la connexion';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (userData: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.register(userData);
      set({
        user: response.user,
        isAuthenticated: false,
        needsRoleSelection: true,
        intentRole: null,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Échec de l'inscription";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  chooseRole: async (role: UserRole) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.chooseRole(role);
      console.log('📦 Response chooseRole:', response);
      set({
        user: response.user,
        isAuthenticated: true,
        needsRoleSelection: false,
        intentRole: role,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Échec du choix du rôle';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authAPI.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        needsRoleSelection: false,
        intentRole: null,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user: User | null) => set({ user }),
}));