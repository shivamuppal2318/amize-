import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_CONFIG } from "./config";
import {
  getTokens,
  refreshTokens,
  removeTokens,
  clearAuthData,
} from "@/lib/auth/tokens";

// Error handler interface - will be set from ErrorContext
interface ErrorHandler {
  showError: (message: string, title?: string) => void;
  showNetworkError: (action?: { label: string; onPress: () => void }) => void;
  showServerError: (message?: string) => void;
  showAuthError: (
    message: string,
    action?: { label: string; onPress: () => void }
  ) => void;
}

// Create a reference that will be set from the ErrorContext
let errorHandler: ErrorHandler | null = null;

// Function to set the error handler from ErrorContext
export const setErrorHandler = (handler: ErrorHandler) => {
  errorHandler = handler;
};

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  "/videos",
  "/videos/trending",
  "/auth/login",
  "/auth/register",
  "/auth/verify-code",
  "/auth/resend-code",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Auth-optional endpoints (work with or without auth)
const AUTH_OPTIONAL_ENDPOINTS = [
  "/videos/", // Single video view (when path includes video ID)
];

// Helper function to check if endpoint is public
const isPublicEndpoint = (url: string): boolean => {
  if (!url) return false;

  // Check exact matches for public endpoints
  if (PUBLIC_ENDPOINTS.some((endpoint) => url === endpoint)) {
    return true;
  }

  // Check if it's a single video endpoint (GET /videos/{id})
  if (
    url.match(/^\/videos\/[^\/]+$/) &&
    !url.includes("/like") &&
    !url.includes("/comment") &&
    !url.includes("/share")
  ) {
    return true;
  }

  return false;
};

// Helper function to check if endpoint is auth-optional
const isAuthOptionalEndpoint = (url: string): boolean => {
  if (!url) return false;

  return AUTH_OPTIONAL_ENDPOINTS.some((endpoint) => {
    if (endpoint.endsWith("/")) {
      return url.startsWith(endpoint);
    }
    return url === endpoint;
  });
};

// Helper function to check if this is an expected 401 (unauthenticated user on optional endpoint)
const isExpected401 = (url: string, method: string): boolean => {
  if (!url) return false;

  // Check for auth-optional endpoints
  if (isAuthOptionalEndpoint(url)) {
    return true;
  }

  // Check for specific patterns that are expected to fail for unauthenticated users
  const expected401Patterns = [
    /\/videos\/[^\/]+\/like$/, // Like status check
    /\/videos\/[^\/]+\/bookmark$/, // Bookmark status check
    /\/users\/[^\/]+\/follow$/, // Follow status check
    /\/videos\/[^\/]+\/view$/, // View recording (can be anonymous)
  ];

  // Only GET requests for status checks should be expected 401s
  if (method.toUpperCase() === "GET") {
    return expected401Patterns.some((pattern) => pattern.test(url));
  }

  return false;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Create a separate axios instance for uploads with longer timeout
export const uploadClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.UPLOAD_TIMEOUT,
  // Don't set Content-Type here, let axios handle it for multipart
});

// Request interceptor to add auth token
const authInterceptor = async (config: any) => {
  const tokens = await getTokens();
  const isPublic = isPublicEndpoint(config.url || "");

  // Only add auth token if not a public endpoint and we have a token
  if (!isPublic && tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  // Remove Content-Type for FormData to let browser set boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // Add a flag to track if this request should have auth
  config.expectsAuth = !isPublic && !!tokens?.accessToken;

  return config;
};

// Apply interceptor to both clients
apiClient.interceptors.request.use(authInterceptor, (error) =>
  Promise.reject(error)
);
uploadClient.interceptors.request.use(authInterceptor, (error) =>
  Promise.reject(error)
);

// Response interceptor for handling token refresh and error display
export const responseInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as AxiosRequestConfig & {
    _retry?: boolean;
    expectsAuth?: boolean;
  };

  const status = error.response?.status;
  const url = originalRequest.url || "";
  const method = originalRequest.method || "GET";

  // Handle 401 Unauthorized errors
  if (status === 401) {
    // Check if this is an expected 401 for unauthenticated users
    if (isExpected401(url, method)) {
      console.log(`Expected 401 for unauthenticated user on ${method} ${url}`);
      // Don't show error, just pass through the error
      return Promise.reject(error);
    }

    // Handle token refresh for authenticated requests
    if (
      !originalRequest._retry &&
      originalRequest.expectsAuth &&
      !url.includes("refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newTokens = await refreshTokens();

        // Update header with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        // Retry the original request with the appropriate client
        const isUpload = originalRequest.data instanceof FormData;
        return isUpload
          ? uploadClient(originalRequest)
          : apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear all auth data
        await clearAuthData();

        // Show auth error with action to re-login
        if (originalRequest.expectsAuth && errorHandler?.showAuthError) {
          errorHandler.showAuthError(
            "Your session has expired. Please log in again.",
            {
              label: "Login",
              onPress: () => {
                // This could trigger navigation to login
                console.log("Navigate to login");
              },
            }
          );
        }

        return Promise.reject(refreshError);
      }
    }

    // For other 401s, check if we should show an error
    if (originalRequest.expectsAuth && errorHandler?.showAuthError) {
      errorHandler.showAuthError(
        "Authentication failed. Please log in again.",
        {
          label: "Login",
          onPress: () => {
            console.log("Navigate to login");
          },
        }
      );
    }
  }

  // Handle all other API errors with enhanced error handling
  if (errorHandler && status !== 401) {
    const errorData = error.response?.data as any;

    // Don't show errors for certain non-critical endpoints
    const shouldSuppressError =
      url.includes("/analytics") || // Analytics might fail gracefully
      url.includes("/view") || // View tracking is not critical
      (method.toUpperCase() === "GET" && isAuthOptionalEndpoint(url));

    if (!shouldSuppressError) {
      // Use specific error handlers based on error type
      if (status === 400) {
        errorHandler.showError(
          errorData?.message || "Invalid request. Please check your data.",
          "Invalid Request"
        );
      } else if (status === 403) {
        errorHandler.showError(
          "You do not have permission to perform this action.",
          "Access Denied"
        );
      } else if (status === 404) {
        errorHandler.showError(
          "The requested resource was not found.",
          "Not Found"
        );
      } else if (status === 413) {
        errorHandler.showError(
          "File too large. Please select a smaller file.",
          "File Too Large"
        );
      } else if (status === 415) {
        errorHandler.showError(
          "Unsupported file type. Please select a different file.",
          "Invalid File Type"
        );
      } else if (status === 429) {
        errorHandler.showError(
          "Too many requests. Please wait a moment and try again.",
          "Rate Limited"
        );
      } else if (status === 500) {
        errorHandler.showServerError(
          errorData?.message || "Server error. Please try again later."
        );
      } else if (status === 503) {
        errorHandler.showServerError(
          "Service unavailable. Please try again later."
        );
      } else if (error.message === "Network Error") {
        errorHandler.showNetworkError({
          label: "Retry",
          onPress: () => {
            // Could implement retry logic here
            console.log("Retry network request");
          },
        });
      } else if (error.code === "ECONNABORTED") {
        errorHandler.showNetworkError({
          label: "Retry",
          onPress: () => {
            console.log("Retry timed out request");
          },
        });
      } else {
        // Generic error
        errorHandler.showError(
          errorData?.message || "Something went wrong. Please try again.",
          "Error"
        );
      }
    }
  }

  return Promise.reject(error);
};

// Apply response interceptor to both clients
apiClient.interceptors.response.use(
  (response) => response,
  responseInterceptor
);
uploadClient.interceptors.response.use(
  (response) => response,
  responseInterceptor
);

export default apiClient;
