import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthResponse,
  AuthService,
  LoginCredentials,
  RegisterData,
} from "../services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("auth_user");
      const storedAccessToken = await AsyncStorage.getItem("auth_token");
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");

      if (storedUser && storedAccessToken) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await AuthService.register(data);
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response: AuthResponse = await AuthService.login(credentials);

      setAccessToken(response.accessToken);
      setUser(response.user);

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("auth_user", JSON.stringify(response.user));

      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
        await AsyncStorage.setItem("refresh_token", response.refreshToken);
      }
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const updated = { ...user!, ...data };
    setUser(updated);
    await AsyncStorage.setItem('auth_user', JSON.stringify(updated));
  };

  const logout = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("auth_user");
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("Iniciando logout. Stored user:", storedUser);
      console.log("storedUser:", storedUser);
      console.log("storedRefreshToken:", storedRefreshToken);

      if (storedUser && storedRefreshToken) {
        const { id } = JSON.parse(storedUser);
        console.log(
          "Llamando AuthService.logout con userId:",
          id,
          "refreshToken:",
          storedRefreshToken,
        );
        await AuthService.logout(id, storedRefreshToken).catch((err) => {
          console.warn("Error en logout backend:", err);
        });
      } else {
        console.warn(
          "No hay storedUser o storedRefreshToken, no se llama al backend",
        );
      }
    } finally {
      await AsyncStorage.multiRemove([
        "auth_token",
        "refresh_token",
        "auth_user",
      ]);

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        register,
        logout,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};