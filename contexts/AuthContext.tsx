import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse, AuthService, LoginCredentials, RegisterData } from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

      if (storedUser && storedAccessToken) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
  try {
    await AuthService.register(data);
  }catch (error) {
    throw error;
  }
  };

const login = async (credentials: LoginCredentials) => {
  try {
    const response: AuthResponse = await AuthService.login(credentials);

    setAccessToken(response.accessToken);
    setUser(response.user);

    await AsyncStorage.setItem('auth_token', response.accessToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));

    if (response.refreshToken) {
      setRefreshToken(response.refreshToken);
      await AsyncStorage.setItem('refresh_token', response.refreshToken);
    }

  } catch (error) {
    throw error;
  }
};


const logout = async () => {
  try {
    //Intenta cerrar sesión en backend si tenemos tokens
    if (user && refreshToken) {
      await AuthService.logout(user.id, refreshToken).catch(() => {
        console.warn('No se pudo cerrar sesión en servidor, cerrando localmente...');
      });
    }

  } finally {
    //cerrar sesión local (aunque falle backend)
    await AsyncStorage.multiRemove([
      'auth_token',
      'refresh_token',
      'auth_user',
    ]);

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }
};



  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      refreshToken,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};