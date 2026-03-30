// Store Zustand — Tâches Kanban — MeedNess Phase 4

import { create } from 'zustand';
import { taskAPI } from '../../services/api/task.api';
import type { Board, Task, CreateTaskData, CreateBoardData } from '../../types/task';

interface TaskState {
  boards: Board[];
  activeBoard: Board | null;
  tasks: Record<string, Task[]>; // boardId → tasks
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  fetchBoards: (orgId: string) => Promise<void>;
  setActiveBoard: (board: Board | null) => void;
  createBoard: (data: CreateBoardData) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;
  fetchTasks: (boardId: string) => Promise<void>;
  createTask: (boardId: string, data: CreateTaskData) => Promise<Task>;
  updateTask: (taskId: string, data: Partial<CreateTaskData>) => Promise<void>;
  moveTask: (taskId: string, columnId: string, order: number) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  addSubTask: (taskId: string, title: string) => Promise<void>;
  toggleSubTask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  clearTasks: () => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  boards: [],
  activeBoard: null,
  tasks: {},
  isLoading: false,
  error: null,

  fetchBoards: async (orgId) => {
    try {
      set({ isLoading: true, error: null });
      const boards = await taskAPI.getBoards(orgId);
      set({ boards, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Erreur chargement tableaux', isLoading: false });
    }
  },

  setActiveBoard: (board) => set({ activeBoard: board }),

  createBoard: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const board = await taskAPI.createBoard(data);
      set((s) => ({ boards: [...s.boards, board], isLoading: false }));
      return board;
    } catch (e: any) {
      set({ error: e.message || 'Erreur création tableau', isLoading: false });
      throw e;
    }
  },

  deleteBoard: async (boardId) => {
    try {
      await taskAPI.deleteBoard(boardId);
      set((s) => ({
        boards: s.boards.filter((b) => b.id !== boardId),
        activeBoard: s.activeBoard?.id === boardId ? null : s.activeBoard,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur suppression tableau' });
    }
  },

  fetchTasks: async (boardId) => {
    try {
      set({ isLoading: true, error: null });
      const board = await taskAPI.getBoardDetail(boardId);
      set((s) => ({
        activeBoard: board,
        tasks: { ...s.tasks, [boardId]: board.columns.flatMap((c) => c.tasks) },
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur chargement tâches', isLoading: false });
    }
  },

  createTask: async (boardId, data) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskAPI.createTask(boardId, data);
      // Refresh board
      await get().fetchTasks(boardId);
      set({ isLoading: false });
      return task;
    } catch (e: any) {
      set({ error: e.message || 'Erreur création tâche', isLoading: false });
      throw e;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const updated = await taskAPI.updateTask(taskId, data);
      const boardId = updated.board;
      await get().fetchTasks(boardId);
    } catch (e: any) {
      set({ error: e.message || 'Erreur modification tâche' });
    }
  },

  moveTask: async (taskId, columnId, order) => {
    try {
      const moved = await taskAPI.moveTask(taskId, { column_id: columnId, order });
      const boardId = moved.board;
      await get().fetchTasks(boardId);
    } catch (e: any) {
      set({ error: e.message || 'Erreur déplacement tâche' });
    }
  },

  archiveTask: async (taskId) => {
    try {
      await taskAPI.archiveTask(taskId);
      const board = get().activeBoard;
      if (board) await get().fetchTasks(board.id);
    } catch (e: any) {
      set({ error: e.message || 'Erreur archivage tâche' });
    }
  },

  addSubTask: async (taskId, title) => {
    try {
      await taskAPI.addSubTask(taskId, title);
      const board = get().activeBoard;
      if (board) await get().fetchTasks(board.id);
    } catch (e: any) {
      set({ error: e.message || 'Erreur ajout sous-tâche' });
    }
  },

  toggleSubTask: async (taskId, subtaskId) => {
    try {
      await taskAPI.toggleSubTask(taskId, subtaskId);
      const board = get().activeBoard;
      if (board) await get().fetchTasks(board.id);
    } catch (e: any) {
      set({ error: e.message || 'Erreur toggle sous-tâche' });
    }
  },

  addComment: async (taskId, content) => {
    try {
      await taskAPI.addComment(taskId, content);
    } catch (e: any) {
      set({ error: e.message || 'Erreur ajout commentaire' });
    }
  },

  clearTasks: () => set({ boards: [], activeBoard: null, tasks: {}, error: null }),
}));
