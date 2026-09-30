import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "darasa_access_token";
const REFRESH_TOKEN_KEY = "darasa_refresh_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/token/")
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            },
          );

          const newAccessToken = response.data.access;

          localStorage.setItem(
            ACCESS_TOKEN_KEY,
            newAccessToken,
          );

          if (response.data.refresh) {
            localStorage.setItem(
              REFRESH_TOKEN_KEY,
              response.data.refresh,
            );
          }

          onRefreshed(newAccessToken);

          isRefreshing = false;

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);

          window.location.href = "/login";

          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization =
            `Bearer ${token}`;

          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  },
);

export { API_BASE_URL };

export default api;