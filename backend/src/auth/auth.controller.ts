// backend/src/auth/auth.controller.ts - AGREGAR ESTOS ENDPOINTS
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  HttpStatus,
  HttpException,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuthService } from './auth.service';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ... otros endpoints existentes (login, etc.)

  // ⭐ NUEVO: CAMBIAR CONTRASEÑA (PARA INSTRUCTOR Y APRENDIZ)
  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Instructor', 'Aprendiz')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
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
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Error interno al cambiar contraseña',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ NUEVO: VERIFICAR CONTRASEÑA ACTUAL (PARA VALIDACIÓN EN FRONTEND)
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
      throw new HttpException(
        'Error al verificar contraseña',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}