import axios from 'axios';
import { BASE_URL, TIMEOUT } from './env';
import { useAuth } from '@/stores/useAuth';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

// Request interceptor: Add Firebase auth token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the current Firebase ID token
      const token = await useAuth.getState().getIdToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token for request:', error);
      // Continue with request even if token fetch fails
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't already retried, attempt to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Force refresh the Firebase ID token
        const newToken = await useAuth.getState().getIdToken();

        if (newToken) {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request with the new token
          return apiClient(originalRequest);
        } else {
          // No token available, user needs to sign in again
          console.warn('Unable to refresh token, user may need to sign in again');
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // If refresh fails, sign out the user
        await useAuth.getState().signOut();
      }
    }

    // Surface network errors in a consistent way for screens/hooks to handle
    const normalizedError = error.response ?? error;
    return Promise.reject(normalizedError);
  }
);
