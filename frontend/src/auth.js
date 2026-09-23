import api from "./api";

const ACCESS_TOKEN_KEY = "darasa_access_token";
const REFRESH_TOKEN_KEY = "darasa_refresh_token";

export async function login(username, password) {
  const response = await api.post("/auth/token/", {
    username,
    password,
  });

  const { access, refresh } = response.data;

  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

  return response.data;
}

export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}