import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@constants/index';
import { logger } from '@utils/logger';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        logger.error('Response interceptor error', error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, params?: any) {
    return this.api.get<T>(url, { params });
  }

  public post<T>(url: string, data?: any) {
    return this.api.post<T>(url, data);
  }

  public put<T>(url: string, data?: any) {
    return this.api.put<T>(url, data);
  }

  public delete<T>(url: string) {
    return this.api.delete<T>(url);
  }
}

export const apiService = new ApiService();
