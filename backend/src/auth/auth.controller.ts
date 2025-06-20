// backend/src/auth/auth.controller.ts - SEPARADO Y LIMPIO
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus, 
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PasswordResetService, PasswordResetRequest, PasswordResetConfirm } from './password-reset.service';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,private readonly passwordResetService: PasswordResetService) {}

  // ⭐ LOGIN
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('🔐 Login attempt for:', loginDto.email);
      const result = await this.authService.login(loginDto);
      console.log('✅ Login successful for:', loginDto.email);
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  // ⭐ OBTENER PERFIL ACTUAL
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    try {
      const user = await this.authService.getProfile(req.user.id);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }
      return user;
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      throw error;
    }
  }

  // ⭐ CAMBIAR CONTRASEÑA (PARA INSTRUCTOR Y APRENDIZ)
  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Instructor', 'Aprendiz')
  async changePassword(
    @Body() changePasswordDto: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    @Request() req: any
  ) {
    try {
      console.log('🔐 POST /auth/change-password - Usuario:', req.user.id);

      const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

      // Validaciones básicas
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new BadRequestException('Todos los campos son obligatorios');
      }

      if (newPassword !== confirmPassword) {
        throw new BadRequestException('La nueva contraseña y su confirmación no coinciden');
      }

      if (newPassword.length < 6) {
        throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
      }

      if (currentPassword === newPassword) {
        throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
      }

      // Cambiar contraseña
      await this.authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      console.log('✅ Contraseña cambiada exitosamente para usuario:', req.user.id);

      return {
        message: 'Contraseña cambiada exitosamente',
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      throw error;
    }
  }

  // ⭐ VERIFICAR CONTRASEÑA ACTUAL
  @Post('verify-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Instructor', 'Aprendiz')
  async verifyCurrentPassword(
    @Body() data: { currentPassword: string },
    @Request() req: any
  ) {
    try {
      console.log('🔍 POST /auth/verify-password - Usuario:', req.user.id);

      if (!data.currentPassword) {
        throw new BadRequestException('Contraseña actual requerida');
      }

      const isValid = await this.authService.verifyCurrentPassword(
        req.user.id,
        data.currentPassword
      );

      return {
        isValid,
        message: isValid ? 'Contraseña válida' : 'Contraseña incorrecta'
      };

    } catch (error) {
      console.error('❌ Error al verificar contraseña:', error);
      return {
        isValid: false,
        message: 'Error al verificar contraseña'
      };
    }
  }

  // ⭐ LOGOUT
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    try {
      await this.authService.logout(req.user.id);
      return { message: 'Sesión cerrada correctamente' };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return { message: 'Sesión cerrada' };
    }
  }

  // ⭐ VERIFICAR TOKEN
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Request() req: any) {
    return { 
      valid: true, 
      user: req.user 
    };
  }
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: PasswordResetRequest) {
    try {
      console.log('🔑 POST /auth/forgot-password');

      if (!forgotPasswordDto.email) {
        throw new BadRequestException('Email es obligatorio');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotPasswordDto.email)) {
        throw new BadRequestException('Formato de email inválido');
      }

      const result = await this.passwordResetService.generateResetToken(forgotPasswordDto.email);
      
      console.log('✅ Solicitud de reset procesada');
      return result;

    } catch (error) {
      console.error('❌ Error en forgot-password:', error);
      throw error;
    }
  }

  // ⭐ VALIDAR TOKEN DE RESET
  @Get('reset-password/validate/:token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Param('token') token: string) {
    try {
      console.log('🔍 GET /auth/reset-password/validate/:token');

      if (!token) {
        throw new BadRequestException('Token es obligatorio');
      }

      const validation = await this.passwordResetService.validateResetToken(token);
      
      if (!validation.valid) {
        return {
          valid: false,
          message: 'Token inválido o expirado'
        };
      }

      return {
        valid: true,
        message: 'Token válido',
        user: {
          email: validation.user?.email,
          firstName: validation.user?.profile?.firstName,
          lastName: validation.user?.profile?.lastName
        }
      };

    } catch (error) {
      console.error('❌ Error validando token:', error);
      return {
        valid: false,
        message: 'Error al validar token'
      };
    }
  }

  // ⭐ CONFIRMAR RESET DE CONTRASEÑA
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: PasswordResetConfirm) {
    try {
      console.log('🔐 POST /auth/reset-password');

      const result = await this.passwordResetService.resetPassword(resetPasswordDto);
      
      console.log('✅ Contraseña reseteada exitosamente');
      return result;

    } catch (error) {
      console.error('❌ Error en reset-password:', error);
      throw error;
    }
  }

  // ⭐ LIMPIAR TOKENS EXPIRADOS (ENDPOINT ADMIN)
  @Post('cleanup-reset-tokens')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  async cleanupResetTokens() {
    try {
      console.log('🧹 POST /auth/cleanup-reset-tokens');
      
      const result = await this.passwordResetService.cleanupExpiredTokens();
      
      console.log('✅ Limpieza de tokens completada');
      return {
        message: `Se limpiaron ${result.cleaned} tokens expirados`,
        cleaned: result.cleaned
      };

    } catch (error) {
      console.error('❌ Error en cleanup:', error);
      throw error;
    }
  }

  // ⭐ VERIFICAR SI UN EMAIL EXISTE (PARA UX)
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmailExists(@Body() data: { email: string }) {
    try {
      console.log('📧 POST /auth/check-email');

      if (!data.email) {
        throw new BadRequestException('Email es obligatorio');
      }

      // Este endpoint es opcional para mejorar UX
      // Permite mostrar mensajes específicos en el frontend
      const user = await this.authService.findUserByEmail(data.email);
      
      return {
        exists: !!user,
        message: user ? 'Email registrado' : 'Email no encontrado'
      };

    } catch (error) {
      console.error('❌ Error verificando email:', error);
      return {
        exists: false,
        message: 'Error al verificar email'
      };
    }
  }
  
  @Get('test-email-config')
  async testEmailConfig() {
    try {
      console.log('🧪 Testing email configuration...');
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO');
      console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
      
      const result = await this.passwordResetService.testEmailConfiguration();
      return { 
        success: true, 
        emailConfigured: result,
        config: {
          emailUser: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASSWORD,
          frontendUrl: process.env.FRONTEND_URL
        }
      };
    } catch (error) {
      console.error('❌ Error testing email:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack
      };
    }
}

  @Post('test-send-email')
  async testSendEmail(@Body() data: { email: string }) {
    try {
      console.log('📧 Testing sending email to:', data.email);
      const result = await this.passwordResetService.generateResetToken(data.email);
      return result;
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return { error: error.message };
    }
  }

}