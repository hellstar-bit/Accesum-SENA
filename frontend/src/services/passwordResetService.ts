// frontend/src/services/passwordResetService.ts
import  api  from './api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // Solo en desarrollo
}

export interface ValidateTokenResponse {
  valid: boolean;
  message: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  message: string;
}

class PasswordResetService {
  // ⭐ SOLICITAR RESET DE CONTRASEÑA
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    console.log('🔑 passwordResetService.forgotPassword:', data.email);
    
    try {
      const response = await api.post('/auth/forgot-password', data);
      console.log('✅ Solicitud de reset enviada');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en forgot-password:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al solicitar reset de contraseña'
      );
    }
  }

  // ⭐ VALIDAR TOKEN DE RESET
  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    console.log('🔍 passwordResetService.validateResetToken');
    
    try {
      const response = await api.get(`/auth/reset-password/validate/${token}`);
      console.log('✅ Token validado:', response.data.valid);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error validando token:', error);
      return {
        valid: false,
        message: 'Error al validar token'
      };
    }
  }

  // ⭐ CONFIRMAR RESET DE CONTRASEÑA
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    console.log('🔐 passwordResetService.resetPassword');
    
    try {
      const response = await api.post('/auth/reset-password', data);
      console.log('✅ Contraseña reseteada');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en reset-password:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al resetear contraseña'
      );
    }
  }

  // ⭐ VERIFICAR SI EMAIL EXISTE
  async checkEmailExists(email: string): Promise<CheckEmailResponse> {
    console.log('📧 passwordResetService.checkEmailExists:', email);
    
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error verificando email:', error);
      return {
        exists: false,
        message: 'Error al verificar email'
      };
    }
  }

  // ⭐ VALIDACIONES LOCALES
  validateEmail(email: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('El email es obligatorio');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Formato de email inválido');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

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
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  // ⭐ GENERAR URL DE RESET PARA EMAIL
  generateResetUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/reset-password/${token}`;
  }
}

export const passwordResetService = new PasswordResetService();