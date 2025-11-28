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

export default api;
