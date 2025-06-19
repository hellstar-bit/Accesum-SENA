// backend/src/auth/auth.controller.ts - SEPARADO Y LIMPIO
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}