import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS, STORAGE_KEYS, API_TIMEOUT } from '../../config/env';
import { storageService } from '../storage/AsyncStorageService';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercepteur requête - Ajoute le token JWT
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storageService.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse - Gère le refresh token automatique
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // ← CORRECTION : utiliser API_BASE_URL + le chemin complet
        const response = await axios.post(
          `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH_TOKEN}`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access } = response.data;
        await storageService.setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, access);

        processQueue(null, access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        // Nettoyer les tokens
        await storageService.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
        await storageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
        await storageService.removeItem(STORAGE_KEYS.USER);

        // ← CORRECTION : import dynamique pour éviter les dépendances circulaires
        const { useAuthStore } = await import('../../store/stores/useAuthStore');
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          needsRoleSelection: false,
          intentRole: null,
          isLoading: false,
          error: null,
        });

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;