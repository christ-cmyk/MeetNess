// Types pour le module Objectifs OKR — MeedNess Phase 5

export type GoalStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'cancelled';
export type GoalVisibility = 'organization' | 'team' | 'private';
export type MetricType = 'number' | 'percentage' | 'currency' | 'boolean';

export interface KeyResultUpdate {
  id: string;
  previous_value: number;
  new_value: number;
  note?: string;
  updated_by: { id: string; username: string; avatar?: string };
  created_at: string;
}

export interface KeyResult {
  id: string;
  goal: string;
  title: string;
  description?: string;
  metric_type: MetricType;
  start_value: number;
  target_value: number;
  current_value: number;
  unit?: string;
  owner?: { id: string; username: string; avatar?: string; full_name?: string };
  progress: number;
  updates: KeyResultUpdate[];
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalMember {
  id: string;
  user: { id: string; username: string; avatar?: string; full_name?: string };
  role: 'owner' | 'contributor' | 'viewer';
  joined_at: string;
}

export interface GoalComment {
  id: string;
  content: string;
  author: { id: string; username: string; avatar?: string; full_name?: string };
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  organization: string;
  team?: string | null;
  owner: { id: string; username: string; avatar?: string; full_name?: string };
  start_date: string;
  end_date: string;
  status: GoalStatus;
  visibility: GoalVisibility;
  parent?: string | null;
  key_results: KeyResult[];
  key_results_count: number;
  members: GoalMember[];
  comments_count: number;
  progress: number;
  days_remaining: number;
  is_overdue: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  end_date: string;
  start_date?: string;
  visibility?: GoalVisibility;
  organization_id: string;
  team_id?: string | null;
  member_ids?: string[];
}

export interface CreateKeyResultData {
  title: string;
  description?: string;
  metric_type: MetricType;
  start_value: number;
  target_value: number;
  unit?: string;
  owner_id?: string | null;
  order?: number;
}

export interface MemberStat {
  user_id: string;
  username: string;
  avatar?: string | null;
  tasks_total: number;
  tasks_completed: number;
  progress: number;
}

export interface OrganizationStats {
  tasks_total: number;
  tasks_completed: number;
  tasks_progress: number;
  goals_total: number;
  goals_completed: number;
  goals_progress: number;
  tasks_on_time: number;
  tasks_overdue: number;
  punctuality_progress: number;
  global_score: number;
  members_stats: MemberStat[];
}
