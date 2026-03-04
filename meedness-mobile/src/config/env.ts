// Configuration de l'API Django pour MeedNess - React Native

// URL de base de l'API
// En dev: utilise l'IP de ta machine, pas localhost (pour le device/emulateur)
const DEV_API_URL = 'http://192.168.88.175:8000/api';
const PROD_API_URL = 'https://api.meedness.com/api';

// __DEV__ est un global React Native, true en dev, false en production
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

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
  INVITE: (id: string) => `/organizations/${id}/invite/`,
  PENDING_INVITATIONS: '/organizations/invitations/pending/',
  ACCEPT_INVITATION: (id: string) => `/organizations/invitations/${id}/accept/`,
} as const;

// Clés de stockage pour les tokens (AsyncStorage / SecureStore)
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'meedness_access_token',
  REFRESH_TOKEN: 'meedness_refresh_token',
  USER: 'meedness_user',
} as const;

// Timeout pour les requêtes API (en ms)
export const API_TIMEOUT = 30000;
