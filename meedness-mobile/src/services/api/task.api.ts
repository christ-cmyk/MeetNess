// API Tâches Kanban — MeedNess Phase 4

import apiClient from './client';
import { TASK_ENDPOINTS } from '../../config/env';
import type {
  Board, Task, TaskComment, TaskActivity, TaskLabel,
  CreateTaskData, CreateBoardData, MoveTaskData, SubTask,
} from '../../types/task.ts';

export const taskAPI = {
  // ── Boards ──
  getBoards: (orgId: string) =>
    apiClient.get<Board[]>(TASK_ENDPOINTS.BOARDS, { params: { org_id: orgId } }).then(r => r.data),

  createBoard: (data: CreateBoardData) =>
    apiClient.post<Board>(TASK_ENDPOINTS.BOARDS, data).then(r => r.data),

  getBoardDetail: (boardId: string) =>
    apiClient.get<Board>(TASK_ENDPOINTS.BOARD_DETAIL(boardId)).then(r => r.data),

  deleteBoard: (boardId: string) =>
    apiClient.delete(TASK_ENDPOINTS.BOARD_DETAIL(boardId)),

  // ── Tasks ──
  getTasks: (boardId: string) =>
    apiClient.get<Task[]>(TASK_ENDPOINTS.BOARD_TASKS(boardId)).then(r => r.data),

  createTask: (boardId: string, data: CreateTaskData) =>
    apiClient.post<Task>(TASK_ENDPOINTS.BOARD_TASKS(boardId), data).then(r => r.data),

  getTaskDetail: (taskId: string) =>
    apiClient.get<Task>(TASK_ENDPOINTS.TASK_DETAIL(taskId)).then(r => r.data),

  updateTask: (taskId: string, data: Partial<CreateTaskData>) =>
    apiClient.put<Task>(TASK_ENDPOINTS.TASK_DETAIL(taskId), data).then(r => r.data),

  archiveTask: (taskId: string) =>
    apiClient.delete(TASK_ENDPOINTS.TASK_DETAIL(taskId)),

  moveTask: (taskId: string, data: MoveTaskData) =>
    apiClient.post<Task>(TASK_ENDPOINTS.TASK_MOVE(taskId), data).then(r => r.data),

  // ── SubTasks ──
  addSubTask: (taskId: string, title: string) =>
    apiClient.post<SubTask>(TASK_ENDPOINTS.TASK_SUBTASKS(taskId), { title }).then(r => r.data),

  toggleSubTask: (taskId: string, subtaskId: string) =>
    apiClient.patch<SubTask>(TASK_ENDPOINTS.SUBTASK_DETAIL(taskId, subtaskId)).then(r => r.data),

  deleteSubTask: (taskId: string, subtaskId: string) =>
    apiClient.delete(TASK_ENDPOINTS.SUBTASK_DETAIL(taskId, subtaskId)),

  // ── Comments ──
  getComments: (taskId: string) =>
    apiClient.get<TaskComment[]>(TASK_ENDPOINTS.TASK_COMMENTS(taskId)).then(r => r.data),

  addComment: (taskId: string, content: string) =>
    apiClient.post<TaskComment>(TASK_ENDPOINTS.TASK_COMMENTS(taskId), { content }).then(r => r.data),

  deleteComment: (taskId: string, commentId: string) =>
    apiClient.delete(TASK_ENDPOINTS.COMMENT_DETAIL(taskId, commentId)),

  // ── Activity ──
  getActivity: (taskId: string) =>
    apiClient.get<TaskActivity[]>(TASK_ENDPOINTS.TASK_ACTIVITY(taskId)).then(r => r.data),

  // ── Labels ──
  getLabels: (orgId: string) =>
    apiClient.get<TaskLabel[]>(TASK_ENDPOINTS.LABELS, { params: { org_id: orgId } }).then(r => r.data),

  createLabel: (orgId: string, name: string, color: string) =>
    apiClient.post<TaskLabel>(TASK_ENDPOINTS.LABELS, { org_id: orgId, name, color }).then(r => r.data),
};
