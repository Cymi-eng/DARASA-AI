
import api from "./api";

const ACCESS_TOKEN_KEY = "darasa_access_token";
const REFRESH_TOKEN_KEY = "darasa_refresh_token";

export async function login(credentialsOrUsername, passwordArgument) {
  let username;
  let password;

  // Support login({ username, password, rememberMe })
  // and login(username, password).
  if (
    credentialsOrUsername !== null &&
    typeof credentialsOrUsername === "object" &&
    !Array.isArray(credentialsOrUsername)
  ) {
    username = credentialsOrUsername.username;
    password = credentialsOrUsername.password;
  } else {
    username = credentialsOrUsername;
    password = passwordArgument;
  }

  if (typeof username !== "string" || !username.trim()) {
    throw new Error("Please enter a valid username.");
  }

  if (typeof password !== "string" || !password) {
    throw new Error("Please enter your password.");
  }

  const response = await api.post("/auth/token/", {
    username: username.trim(),
    password,
  });

  const { access, refresh } = response.data;

  if (!access || !refresh) {
    throw new Error("The server did not return valid authentication tokens.");
  }

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
