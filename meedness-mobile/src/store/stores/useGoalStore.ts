// Store Zustand pour les Objectifs OKR — MeedNess Phase 5

import { create } from 'zustand';
import { goalAPI } from '../../services/api/goal.api';
import type {
  Goal,
  CreateGoalData,
  CreateKeyResultData,
  OrganizationStats,
} from '../../types/goal';

interface GoalState {
  goals: Goal[];
  activeGoal: Goal | null;
  stats: OrganizationStats | null;
  isLoading: boolean;
  error: string | null;
}

interface GoalActions {
  fetchGoals: (orgId: string, filters?: Record<string, string>) => Promise<void>;
  setActiveGoal: (goal: Goal | null) => void;
  createGoal: (data: CreateGoalData) => Promise<Goal>;
  updateGoal: (goalId: string, data: Partial<Goal>) => Promise<void>;
  archiveGoal: (goalId: string) => Promise<void>;
  createKeyResult: (goalId: string, data: CreateKeyResultData) => Promise<void>;
  updateKeyResultValue: (krId: string, value: number, note?: string) => Promise<void>;
  addComment: (goalId: string, content: string) => Promise<void>;
  fetchStats: (orgId: string) => Promise<void>;
  clearGoals: () => void;
  clearError: () => void;
}

type GoalStore = GoalState & GoalActions;

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  activeGoal: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchGoals: async (orgId, filters) => {
    try {
      set({ isLoading: true, error: null });
      const goals = await goalAPI.getGoals(orgId, filters);
      set({ goals, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur de chargement',
        isLoading: false,
      });
    }
  },

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  createGoal: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const goal = await goalAPI.createGoal(data);
      set((s) => ({ goals: [goal, ...s.goals], isLoading: false }));
      return goal;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Échec de la création';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateGoal: async (goalId, data) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await goalAPI.updateGoal(goalId, data);
      set((s) => ({
        goals: s.goals.map((g) => (g.id === goalId ? updated : g)),
        activeGoal: s.activeGoal?.id === goalId ? updated : s.activeGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur de mise à jour',
        isLoading: false,
      });
    }
  },

  archiveGoal: async (goalId) => {
    try {
      set({ isLoading: true, error: null });
      await goalAPI.archiveGoal(goalId);
      set((s) => ({
        goals: s.goals.filter((g) => g.id !== goalId),
        activeGoal: s.activeGoal?.id === goalId ? null : s.activeGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || "Erreur d'archivage",
        isLoading: false,
      });
    }
  },

  createKeyResult: async (goalId, data) => {
    try {
      set({ isLoading: true, error: null });
      await goalAPI.createKeyResult(goalId, data);
      const updated = await goalAPI.getGoalDetail(goalId);
      set((s) => ({
        goals: s.goals.map((g) => (g.id === goalId ? updated : g)),
        activeGoal: s.activeGoal?.id === goalId ? updated : s.activeGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur',
        isLoading: false,
      });
    }
  },

  updateKeyResultValue: async (krId, value, note) => {
    try {
      set({ isLoading: true, error: null });
      await goalAPI.updateKeyResultValue(krId, value, note);
      const { activeGoal } = get();
      if (activeGoal) {
        const updated = await goalAPI.getGoalDetail(activeGoal.id);
        set((s) => ({
          goals: s.goals.map((g) => (g.id === updated.id ? updated : g)),
          activeGoal: updated,
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur de mise à jour',
        isLoading: false,
      });
    }
  },

  addComment: async (goalId, content) => {
    try {
      await goalAPI.addComment(goalId, content);
      const updated = await goalAPI.getGoalDetail(goalId);
      set((s) => ({
        goals: s.goals.map((g) => (g.id === goalId ? updated : g)),
        activeGoal: s.activeGoal?.id === goalId ? updated : s.activeGoal,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur',
      });
    }
  },

  fetchStats: async (orgId) => {
    try {
      set({ isLoading: true, error: null });
      const stats = await goalAPI.getOrgStats(orgId);
      set({ stats, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Erreur stats',
        isLoading: false,
      });
    }
  },

  clearGoals: () => set({ goals: [], activeGoal: null, stats: null, error: null }),
  clearError: () => set({ error: null }),
}));
