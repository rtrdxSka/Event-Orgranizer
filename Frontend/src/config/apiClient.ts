import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import queryClient from './queryClient';
import { navigate } from '@/lib/navigation';

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

const API = axios.create(options);

interface APIError {
  response: {
    status: number;
    data: {
      errorCode?: string;
      [key: string]: unknown;
    };
  };
  config: AxiosRequestConfig;
}

// Add a flag to track token validity
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const isPublicRoute = () => {
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const currentPath = window.location.pathname;
  return publicRoutes.includes(currentPath) || currentPath.startsWith('/reset-password');
};

API.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: APIError) => {
    const { config, response } = error;
    const { status, data } = response || {};

    if (status === 401 && data?.errorCode === "INVALID_ACCESS_TOKEN") {
      // If already refreshing, wait for that refresh to complete
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          // Retry the original request after refresh completes
          return API(config);
         } catch {
          // Refresh failed, redirect to login only if not on public route
          queryClient.clear();
          if (!isPublicRoute()) {
            navigate("/login", {
              state: {
                redirectUrl: window.location.pathname
              }
            } as { state: { redirectUrl: string } });
          }
          return Promise.reject({ status, ...data });
        }
      }

      // Start the refresh process
      isRefreshing = true;
      refreshPromise = API.get("/auth/refresh")
        .then(() => {
          // Success - reset flags
          isRefreshing = false;
          refreshPromise = null;
        })
        .catch((refreshError) => {
          // Failed - reset flags and redirect only if not on public route
          isRefreshing = false;
          refreshPromise = null;
          queryClient.clear();
          if (!isPublicRoute()) {
            navigate("/login", {
              state: {
                redirectUrl: window.location.pathname
              }
            } as { state: { redirectUrl: string } });
          }
          throw refreshError;
        });

      try {
        await refreshPromise;
        // Token refreshed successfully, retry the original request
        return API(config);
      } catch {
        // Already handled in the catch above
        return Promise.reject({ status, ...data });
      }
    }
    
    return Promise.reject({ status, ...data });
  }
);

export default API;