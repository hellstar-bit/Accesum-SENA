// frontend/src/services/passwordService.ts
import api from './api';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResponse {
  message: string;
  success: boolean;
  timestamp: string;
}

export interface VerifyPasswordResponse {
  isValid: boolean;
  message: string;
}

class PasswordService {
  // ⭐ CAMBIAR CONTRASEÑA
  async changePassword(data: ChangePasswordData): Promise<PasswordResponse> {
    console.log('🔐 passwordService.changePassword - Iniciando...');
    
    try {
      const response = await api.post('/auth/change-password', data);
      console.log('✅ passwordService.changePassword - Exitoso');
      return response.data;
    } catch (error: any) {
      console.error('❌ passwordService.changePassword - Error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al cambiar contraseña';
      
      throw new Error(errorMessage);
    }
  }

  // ⭐ VERIFICAR CONTRASEÑA ACTUAL
  async verifyCurrentPassword(currentPassword: string): Promise<VerifyPasswordResponse> {
    console.log('🔍 passwordService.verifyCurrentPassword - Verificando...');
    
    try {
      const response = await api.post('/auth/verify-password', { currentPassword });
      console.log('✅ passwordService.verifyCurrentPassword - Exitoso');
      return response.data;
    } catch (error: any) {
      console.error('❌ passwordService.verifyCurrentPassword - Error:', error);
      
      // Retornar respuesta de error en lugar de lanzar excepción
      return {
        isValid: false,
        message: error.response?.data?.message || 'Error al verificar contraseña'
      };
    }
  }

  // ⭐ VALIDAR FORMATO DE CONTRASEÑA
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('La contraseña es obligatoria');
    } else {
      if (password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
      }
      
      if (password.length > 50) {
        errors.push('La contraseña no puede tener más de 50 caracteres');
      }
      
      // Opcional: agregar más validaciones
      // if (!/[A-Z]/.test(password)) {
      //   errors.push('La contraseña debe contener al menos una mayúscula');
      // }
      
      // if (!/[0-9]/.test(password)) {
      //   errors.push('La contraseña debe contener al menos un número');
      // }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ⭐ VALIDAR QUE LAS CONTRASEÑAS COINCIDAN
  validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  // ⭐ GENERAR SUGERENCIAS DE CONTRASEÑA SEGURA
  generatePasswordSuggestions(): string[] {
    return [
      'Usa al menos 8 caracteres',
      'Combina letras mayúsculas y minúsculas',
      'Incluye números y símbolos',
      'Evita información personal',
      'No uses contraseñas comunes',
    ];
  }
}

export const passwordService = new PasswordService();