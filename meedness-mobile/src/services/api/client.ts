// Client HTTP Axios configuré pour MeedNess - React Native

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS, STORAGE_KEYS, API_TIMEOUT } from '../../config/env';
import { storageService } from '../storage/AsyncStorageService';

// Créer l'instance Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag pour éviter les boucles infinies de refresh
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

// Intercepteur de requête - Ajoute le token JWT
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storageService.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse - Gère le refresh token automatique
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas encore en retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Attendre que le refresh soit terminé
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

        const response = await axios.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await storageService.setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, access);

        processQueue(null, access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        
        // Nettoyer les tokens - l'utilisateur doit se reconnecter
        await storageService.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
        await storageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
        await storageService.removeItem(STORAGE_KEYS.USER);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
