// Types d'authentification pour MeedNess - React Native

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone: string;
  country: string;
  role: UserRole;
  avatar?: string;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  password_confirm: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
  needs_role_selection?: boolean;
}

export interface ChooseRoleResponse {
  user: User;
  message: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}