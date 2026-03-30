// Types pour le module Tâches Kanban — MeedNess Phase 4

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ColumnType = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'custom';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  is_done: boolean;
  order: number;
  created_by: { id: string; username: string; avatar?: string };
  created_at: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: { id: string; username: string; avatar?: string; full_name?: string };
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  action: string;
  detail: Record<string, any>;
  user: { id: string; username: string; avatar?: string };
  created_at: string;
}

export interface Task {
  id: string;
  board: string;
  column: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  order: number;
  assigned_to: { id: string; username: string; avatar?: string; full_name?: string }[];
  created_by: { id: string; username: string; avatar?: string };
  labels: TaskLabel[];
  subtasks: SubTask[];
  attachments: any[];
  comments_count: number;
  due_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  is_overdue: boolean;
  progress: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board: string;
  name: string;
  column_type: ColumnType;
  order: number;
  color: string;
  task_limit?: number | null;
  tasks: Task[];
  tasks_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  organization: string;
  team?: string | null;
  created_by: { id: string; username: string };
  columns: Column[];
  tasks_count: number;
  members_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  column_id: string;
  priority?: TaskPriority;
  assigned_to?: string[];
  label_ids?: string[];
  due_date?: string | null;
  estimated_hours?: number | null;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  organization_id: string;
  team_id?: string | null;
}

export interface MoveTaskData {
  column_id: string;
  order: number;
}
