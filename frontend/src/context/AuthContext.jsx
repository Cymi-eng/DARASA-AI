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
  login,
  logout,
} from "../auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getAccessToken())
  );

  const [user, setUser] = useState(null);

  useEffect(() => {
    const restoreUser = async () => {
      const token = getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const response = await api.get("/users/me/");

        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    restoreUser();
  }, []);

  const handleLogin = async (username, password) => {
    await login(username, password);

    const response = await api.get("/users/me/");

    setUser(response.data);
    setIsAuthenticated(true);

    return response.data;
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