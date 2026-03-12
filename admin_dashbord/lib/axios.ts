import axios from 'axios';
import { showErrorToast, showSuccessToast } from './toast-handler';

// Promise to wait for auth state to be ready
let authStateReady = false;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add Firebase token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {

        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request');
      } else {
        console.warn('No authenticated user found');
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Show success toast for successful requests (optional, can be customized)
    if (response.config.method !== 'get') {
      const method = response.config.method?.toUpperCase();
      const successMessages: Record<string, string> = {
        POST: 'Created successfully',
        PUT: 'Updated successfully',
        PATCH: 'Updated successfully',
        DELETE: 'Deleted successfully',
      };

      if (method && successMessages[method]) {
        showSuccessToast(successMessages[method]);
      }
    }
    return response;
  },
  (error) => {
    // Handle different error cases
    if (error.response?.status === 401) {
      console.error('Unauthorized - token might be expired');
      showErrorToast('Your session has expired. Please login again.', 'Authentication Error');
      // Sign out the user and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Forbidden - user does not have required permissions');
      showErrorToast('You do not have permission to perform this action. Please login with an account that has access.', 'Access Denied');
      // Sign out the user and redirect to login to ensure they re-authenticate
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    else if (error.response?.status === 404) {
      showErrorToast('The requested resource was not found.', 'Not Found');

    }
    else if (error.response?.status === 400) {
      showErrorToast(error.response.data?.message || 'Bad request. Please check your input and try again.', 'Bad Request');

    }
    else if (error.response?.status === 500) {
      showErrorToast('Something went wrong on the server. Please try again later.', 'Server Error');
    } else if (error.response?.data?.message) {
      showErrorToast(error.response.data?.message, 'Error');
    } else if (error.message === 'Network Error') {
      showErrorToast('Network error. Please check your internet connection.', 'Connection Error');
    } else {
      showErrorToast(error.message || 'An unexpected error occurred.', 'Error');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;