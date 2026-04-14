import { config as baseURL, getApiUrl } from '../config/environment';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  };
}

export class AuthError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const url = getApiUrl('/login');
    console.log('Attempting login to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.status === 401) {
        throw new AuthError('INVALID_CREDENTIALS', 'Credenciales incorrectas');
      }

      if (response.status >= 500) {
        throw new AuthError('SERVER_ERROR', 'Error del servidor');
      }

      if (!response.ok) {
        throw new AuthError('UNKNOWN_ERROR', `Error ${response.status}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.log('Login error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new AuthError('NETWORK_ERROR', 'No se pudo conectar al servidor');
      }
      throw new AuthError('NETWORK_ERROR', 'Error de conexión');
    }
  }

  static async register(data: RegisterData): Promise<AuthResponse> {

    const url = baseURL.apiBaseUrl + '/users';
    console.log('Attempting registration to:');
        try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.status === 401) {
        throw new AuthError('INVALID_CREDENTIALS', 'Credenciales incorrectas');
      }

      if (response.status >= 500) {
        throw new AuthError('SERVER_ERROR', 'Error del servidor');
      }

      if (!response.ok) {
        throw new AuthError('UNKNOWN_ERROR', `Error ${response.status}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.log('Register error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new AuthError('NETWORK_ERROR', 'No se pudo conectar al servidor');
      }
      throw new AuthError('NETWORK_ERROR', 'Error de conexión');
    }
  }

static async logout(userId: string, refreshToken: string): Promise<any> {
  const url = getApiUrl('/logout');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        refreshToken,
      }),
    });

    const responseText = await response.text();

    if (response.status === 401) {
      throw new AuthError('INVALID_CREDENTIALS', 'Refresh token inválido');
    }
    if (response.status >= 500) {
      throw new AuthError('SERVER_ERROR', 'Error del servidor');
    }
    if (!response.ok) {
      throw new AuthError('UNKNOWN_ERROR', `Error ${response.status}`);
    }

    return JSON.parse(responseText || '{}');

  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new AuthError('NETWORK_ERROR', 'No se pudo conectar al servidor');
    }
    throw new AuthError('NETWORK_ERROR', 'Error de conexión');
  }
}

}