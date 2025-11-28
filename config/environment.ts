const getLocalApiUrl = () => {
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'local') {
    // Para desarrollo local, usar la IP que muestra Expo
    return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.3:3000/api';
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.3:3000';
};

export const config = {
  apiBaseUrl: getLocalApiUrl(),
  apiAuthEndpoint: process.env.EXPO_PUBLIC_API_AUTH_ENDPOINT || '/auth',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'local',
};

export const getApiUrl = (endpoint: string) => {
  const url = `${config.apiBaseUrl}${config.apiAuthEndpoint}${endpoint}`;
  console.log('API URL:', url);
  return url;
};