import axios from "axios";

// ──────────────────────────────────────────────
// Axios instance — centralized API client
// all API calls go through this so we can:
// - set base URL in one place
// - auto-attach JWT tokens to every reqeust
// - handle token refresh automaticaly
// - centralize error handeling
// ──────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds — if the server hasnt responded by then, somethings wrong
});

// ─── Request Interceptor ───
// attaches the JWT token to every outgoin request
// so we dont have to manually add headers in every API call
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───
// handles token expiry automaticaly:
// 1. if we get a 401, try to refresh the token
// 2. if refresh works, retry the orignal request
// 3. if refresh fails too, log out the user
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // only try refresh for 401s, and dont retry the refresh endpoint itself
    // (that would cause an infinte loop lol)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // if were already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // no refresh token — user needs to login again
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
