import { createContext, useContext, useMemo, useState } from "react";
import { login as apiLogin } from "../services/api";

const AuthContext = createContext(null);

/* eslint-disable react-refresh/only-export-components */

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem("tcc_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const storedAuth = getStoredAuth();
  const [user, setUser] = useState(storedAuth?.user || null);
  const [token, setToken] = useState(storedAuth?.token || "");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const login = async ({ usuario, password }) => {
    setStatus("loading");
    setError("");

    try {
      const data = await apiLogin({ usuario, password });
      const nextUser = {
        ...data.usuario,
        email: data.usuario?.email || "",
        isAdmin: data.usuario?.user_nivel_acesso === "admin",
      };

      setUser(nextUser);
      setToken(data.token);
      localStorage.setItem(
        "tcc_auth",
        JSON.stringify({ token: data.token, user: nextUser })
      );
      setStatus("idle");
      return { ok: true };
    } catch (loginError) {
      setStatus("error");
      setError(loginError.message || "Erro ao autenticar");
      return { ok: false, message: loginError.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setStatus("idle");
    setError("");
    localStorage.removeItem("tcc_auth");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      error,
      login,
      logout,
      isAdmin: user?.isAdmin || user?.user_nivel_acesso === "admin",
    }),
    [user, token, status, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
