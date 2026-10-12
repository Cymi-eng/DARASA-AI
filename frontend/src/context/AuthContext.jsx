
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api";
import {
  getAccessToken,
  login as authenticate,
  logout,
} from "../auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getAccessToken())
  );

  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    const restoreUser = async () => {
      const token = getAccessToken();

      if (!token) {
        if (active) {
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }

      try {
        const response = await api.get("/users/me/");

        if (active) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch {
        if (active) {
          logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    restoreUser();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (credentialsOrUsername, passwordArgument) => {
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
      throw new Error("Please enter your username.");
    }

    if (typeof password !== "string" || !password) {
      throw new Error("Please enter your password.");
    }

    // The authentication function expects separate string arguments.
    await authenticate(username.trim(), password);

    try {
      const response = await api.get("/users/me/");

      setUser(response.data);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      logout();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login: handleLogin,
      logout: handleLogout,
    }),
    [isAuthenticated, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}
