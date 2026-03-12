import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { showErrorToast, showSuccessToast } from "./toast-handler";

// Extend axios config to support skipToast flag
declare module "axios" {
  interface AxiosRequestConfig {
    skipToast?: boolean;
  }
}

// Promise to wait for auth state to be ready
let authStateReady = false;

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true,
});

// Request interceptor to add Firebase token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Token added to request");
      } else {
        console.warn("No authenticated user found");
      }
    } catch (error) {
      console.error("Error getting token for request:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling with refresh token support
axiosInstance.interceptors.response.use(
  (response) => {
    // Skip toast if skipToast flag is set (e.g. auth pages handle errors inline)
    if (response.config.skipToast) return response;

    // Show success toast for successful requests (optional, can be customized)
    if (response.config.method !== "get") {
      const method = response.config.method?.toUpperCase();
      const successMessages: Record<string, string> = {
        POST: "Created successfully",
        PUT: "Updated successfully",
        PATCH: "Updated successfully",
        DELETE: "Deleted successfully",
      };

      if (method && successMessages[method]) {
        showSuccessToast(successMessages[method]);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 - Unauthorized: Try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenValue = localStorage.getItem("refreshToken");

      if (!refreshTokenValue) {
        // No refresh token, redirect to login
        console.error("No refresh token available");
        showErrorToast(
          "Your session has expired. Please login again.",
          "Authentication Error",
        );
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}auth/refresh-token`,
          { refreshToken: refreshTokenValue },
        );

        const newToken = response.data.token;
        localStorage.setItem("token", newToken);

        // Update authorization header for retried request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Refresh token failed, clear tokens and redirect to login
        console.error("Refresh token failed");
        showErrorToast(
          "Your session has expired. Please login again.",
          "Authentication Error",
        );
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 - Forbidden: Redirect to login
    if (error.response?.status === 403) {
      console.error("Forbidden - access denied");
      showErrorToast(
        "Access denied. Please login with an account that has access.",
        "Access Denied",
      );
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Skip toast if skipToast flag is set (auth pages handle errors inline)
    if (!originalRequest.skipToast) {
      // Handle other error cases
      if (error.response?.status === 404) {
        showErrorToast("The requested resource was not found.", "Not Found");
      } else if (error.response?.status === 400) {
        showErrorToast(
          (error.response.data as { message?: string })?.message ||
            "Bad request. Please check your input and try again.",
          "Bad Request",
        );
      } else if (error.response?.status === 500) {
        showErrorToast(
          "Something went wrong on the server. Please try again later.",
          "Server Error",
        );
      } else if ((error.response?.data as { message?: string })?.message) {
        showErrorToast(
          (error.response?.data as { message?: string })?.message || "Error",
          "Error",
        );
      } else if (error.message === "Network Error") {
        showErrorToast(
          "Network error. Please check your internet connection.",
          "Connection Error",
        );
      } else {
        showErrorToast(
          error.message || "An unexpected error occurred.",
          "Error",
        );
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
