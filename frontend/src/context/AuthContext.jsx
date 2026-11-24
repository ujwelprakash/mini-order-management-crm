import { createContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  saveAuthData,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      saveAuthData(data);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);

    try {
      const data = await registerUser(name, email, password);

      if (data.accessToken) {
        saveAuthData(data);
      }

      if (data.user) {
        setUser(data.user);
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
