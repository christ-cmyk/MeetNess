// Service API Objectifs OKR — MeedNess Phase 5

import apiClient from './client';
import { GOAL_ENDPOINTS } from '../../config/env';
import type {
  Goal,
  KeyResult,
  GoalComment,
  CreateGoalData,
  CreateKeyResultData,
  OrganizationStats,
} from '../../types/goal';

export const goalAPI = {
  getGoals: async (orgId: string, filters?: Record<string, string>): Promise<Goal[]> => {
    const params: Record<string, string> = { org_id: orgId, ...filters };
    const { data } = await apiClient.get(GOAL_ENDPOINTS.LIST, { params });
    return data.results ?? data;
  },

  createGoal: async (payload: CreateGoalData): Promise<Goal> => {
    const { data } = await apiClient.post(GOAL_ENDPOINTS.LIST, payload);
    return data;
  },

  getGoalDetail: async (goalId: string): Promise<Goal> => {
    const { data } = await apiClient.get(GOAL_ENDPOINTS.DETAIL(goalId));
    return data;
  },

  updateGoal: async (goalId: string, payload: Partial<Goal>): Promise<Goal> => {
    const { data } = await apiClient.put(GOAL_ENDPOINTS.DETAIL(goalId), payload);
    return data;
  },

  archiveGoal: async (goalId: string): Promise<void> => {
    await apiClient.delete(GOAL_ENDPOINTS.DETAIL(goalId));
  },

  getKeyResults: async (goalId: string): Promise<KeyResult[]> => {
    const { data } = await apiClient.get(GOAL_ENDPOINTS.KEY_RESULTS(goalId));
    return data.results ?? data;
  },

  createKeyResult: async (goalId: string, payload: CreateKeyResultData): Promise<KeyResult> => {
    const { data } = await apiClient.post(GOAL_ENDPOINTS.KEY_RESULTS(goalId), payload);
    return data;
  },

  updateKeyResultValue: async (
    krId: string,
    value: number,
    note?: string,
  ): Promise<KeyResult> => {
    const { data } = await apiClient.post(GOAL_ENDPOINTS.KR_UPDATE(krId), {
      new_value: value,
      note,
    });
    return data;
  },

  getComments: async (goalId: string): Promise<GoalComment[]> => {
    const { data } = await apiClient.get(GOAL_ENDPOINTS.COMMENTS(goalId));
    return data.results ?? data;
  },

  addComment: async (goalId: string, content: string): Promise<GoalComment> => {
    const { data } = await apiClient.post(GOAL_ENDPOINTS.COMMENTS(goalId), { content });
    return data;
  },

  deleteComment: async (goalId: string, commentId: string): Promise<void> => {
    await apiClient.delete(GOAL_ENDPOINTS.COMMENT_DETAIL(goalId, commentId));
  },

  getOrgStats: async (orgId: string): Promise<OrganizationStats> => {
    const { data } = await apiClient.get(GOAL_ENDPOINTS.STATS, {
      params: { org_id: orgId },
    });
    return data;
  },
};
