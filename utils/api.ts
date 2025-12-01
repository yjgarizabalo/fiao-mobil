import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { config } from '../config/environment';


const api = axios.create({
  baseURL: config.apiBaseUrl,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
//refresh token
let isRefreshing = false;
let queue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  queue.forEach(p => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  queue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {

    const originalRequest = error.config;

    // Si el token expiró
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        // Espera a que el token se refresque
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const user = await AsyncStorage.getItem("auth_user");
        console.log("refreshToken:", refreshToken);
        console.log("user:", user);
        if (!refreshToken || !user) {
          throw new Error("No hay refresh token");
        }

        const { id } = JSON.parse(user);

        //  Petición al backend para renovar token
        const response = await axios.post(
          `${config.apiBaseUrl}/auth/refresh`,
          { userId: id },
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );

        const newToken = response.data.token;
        const newRefreshToken = response.data.refreshToken;

        // Guarda nuevos tokens
        await AsyncStorage.setItem("auth_token", newToken);
        await AsyncStorage.setItem("refresh_token", newRefreshToken);

        //  Actualiza header global
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        // Reintenta la request original
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);

        //  Si falla → logout forzado
        await AsyncStorage.multiRemove([
          "auth_token",
          "refresh_token",
          "auth_user"
        ]);

        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
