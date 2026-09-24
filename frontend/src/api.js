import axios from "axios";

const API_BASE_URL = "https://darasa-ai.onrender.com/api";

const ACCESS_TOKEN_KEY = "darasa_access_token";
const REFRESH_TOKEN_KEY = "darasa_refresh_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

function clearAuthentication() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/token/refresh/", {
        refresh: refreshToken,
      })
      .then((response) => {
        const newAccessToken = response.data.access;

        if (!newAccessToken) {
          throw new Error("No access token returned.");
        }

        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          newAccessToken
        );

        return newAccessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAuthentication();

      return Promise.reject(refreshError);
    }
  }
);

export default api;