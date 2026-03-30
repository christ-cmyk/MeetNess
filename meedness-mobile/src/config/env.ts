// Configuration de l'API Django pour MeedNess - React Native

// URL de base de l'API
const DEV_API_URL = 'http://192.168.1.6:8000/api';
const PROD_API_URL = 'https://api.meedness.com/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

// WebSocket
const DEV_WS_URL = 'ws://192.168.1.6:8000/ws';
const PROD_WS_URL = 'wss://api.meedness.com/ws';

export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || DEV_WS_URL;

// Endpoints d'authentification
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  CHOOSE_ROLE: '/auth/choose-role/',
  LOGOUT: '/auth/logout/',
  REFRESH_TOKEN: '/auth/token/refresh/',
  PASSWORD_RESET: '/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  VERIFY_EMAIL: '/auth/verify-email/',
  USER_PROFILE: '/auth/me/',
} as const;

// Endpoints Organisations
export const ORG_ENDPOINTS = {
  CREATE: '/organizations/',
  LIST: '/organizations/',
  MY: '/organizations/my/',
  TEAMS: '/organizations/teams/',
  INVITE: (id: string) => `/organizations/${id}/invite/`,
  PENDING_INVITATIONS: '/organizations/invitations/pending/',
  ACCEPT_INVITATION: (id: string) => `/organizations/invitations/${id}/accept/`,
} as const;

// Endpoints Chat
export const CHAT_ENDPOINTS = {
  ROOMS: '/chat/rooms/',
  ROOM_DETAIL: (id: string) => `/chat/rooms/${id}/`,
  MESSAGES: (id: string) => `/chat/rooms/${id}/messages/`,
  MARK_READ: (id: string) => `/chat/rooms/${id}/read/`,
  DIRECT: (userId: string) => `/chat/direct/${userId}/`,
  USERS_SEARCH: '/chat/users/search/',
  BLOCK_USER: (userId: string) => `/chat/users/${userId}/block/`,
} as const;

// Helper pour construire l'URL WebSocket du chat
export const WS_CHAT_URL = (roomId: string, token: string) =>
  `${WS_BASE_URL}/chat/${roomId}/?token=${token}`;

// Clés de stockage pour les tokens
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'meedness_access_token',
  REFRESH_TOKEN: 'meedness_refresh_token',
  USER: 'meedness_user',
} as const;

// Endpoints Tâches Kanban
export const TASK_ENDPOINTS = {
  BOARDS: '/tasks/boards/',
  BOARD_DETAIL: (id: string) => `/tasks/boards/${id}/`,
  BOARD_TASKS: (id: string) => `/tasks/boards/${id}/tasks/`,
  TASK_DETAIL: (id: string) => `/tasks/${id}/`,
  TASK_MOVE: (id: string) => `/tasks/${id}/move/`,
  TASK_SUBTASKS: (id: string) => `/tasks/${id}/subtasks/`,
  SUBTASK_DETAIL: (taskId: string, subId: string) => `/tasks/${taskId}/subtasks/${subId}/`,
  TASK_COMMENTS: (id: string) => `/tasks/${id}/comments/`,
  COMMENT_DETAIL: (taskId: string, commentId: string) => `/tasks/${taskId}/comments/${commentId}/`,
  TASK_ACTIVITY: (id: string) => `/tasks/${id}/activity/`,
  LABELS: '/tasks/labels/',
} as const;

// Timeout pour les requêtes API (en ms)
export const API_TIMEOUT = 30000;
