import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const loadProfile = useCallback(async () => {
    if (!token) return;

    try {
      const data = await api.getMe(token);
      const perms = Array.isArray(data.permissions) ? data.permissions : [];

      setPermissions(perms);
      localStorage.setItem("permissions", JSON.stringify(perms));
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);

    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    }

    setUser(newUser || null);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");

    setPermissions([]);
    setUser(null);
    setToken(null);
  };

  return {
    token,
    user,
    role: user?.role,
    permissions,
    login,
    logout,
  };
}
