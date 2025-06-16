// frontend/src/services/authService.ts - CON VERIFICACIÓN
import api from './api';
import type { User, AuthUser } from '../types/user.types';


interface LoginResponse {
  user: User;
  access_token: string;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('🔐 AuthService.login iniciado con:', { email });
      
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      console.log('✅ Login exitoso, respuesta completa:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      // ✅ VERIFICACIONES ESTRICTAS
      if (!response.data) {
        throw new Error('Respuesta vacía del servidor');
      }

      if (!response.data.access_token) {
        console.error('❌ No hay access_token en la respuesta:', response.data);
        throw new Error('Token no recibido del servidor');
      }

      if (!response.data.user) {
        console.error('❌ No hay user en la respuesta:', response.data);
        throw new Error('Datos de usuario no recibidos del servidor');
      }

      const authData: AuthUser = {
        user: response.data.user,
        token: response.data.access_token,
      };

      console.log('🎫 Token obtenido del backend:', {
        tokenExists: !!authData.token,
        tokenLength: authData.token.length,
        tokenPreview: authData.token.substring(0, 50) + '...',
        userExists: !!authData.user,
        userRole: authData.user.role?.name
      });

      return authData;
      
    } catch (error: any) {
      console.error('❌ Error detallado en authService.login:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      console.log('👤 AuthService.getCurrentUser iniciado');
      
      // Verificar que el token existe
      const token = localStorage.getItem('token');
      console.log('🎫 Token en localStorage:', token ? 'EXISTE' : 'NO EXISTE');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await api.get<User>('/auth/profile');
      console.log('✅ Usuario obtenido:', response.data);
      
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error en getCurrentUser:', error);
      
      // Si el token es inválido, limpiarlo
      if (error?.response?.status === 401) {
        console.log('🗑️ Token inválido, limpiando localStorage');
        localStorage.removeItem('token');
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      console.error('Error en logout:', error);
      // Continuar con el logout aunque falle el request
    } finally {
      localStorage.removeItem('token');
    }
  }
}

export const authService = new AuthService();