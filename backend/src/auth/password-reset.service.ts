// backend/src/auth/password-reset.service.ts - VERSIÓN COMPLETA FIXED
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Para rate limiting simple (en memoria)
interface RateLimitEntry {
  count: number;
  lastRequest: Date;
}

@Injectable()
export class PasswordResetService {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_REQUESTS_PER_HOUR = 3;
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora en milisegundos

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // ⭐ GENERAR TOKEN DE RECUPERACIÓN CON EMAIL
  async generateResetToken(email: string): Promise<{ message: string; resetToken?: string }> {
    console.log('🔑 Generando token de recuperación para:', email);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 EmailService disponible:', !!this.emailService);
    console.log('🔧 EMAIL_USER configurado:', !!process.env.EMAIL_USER);

    // Rate limiting
    if (!this.checkRateLimit(email)) {
      throw new BadRequestException(
        'Demasiadas solicitudes. Inténtalo de nuevo en una hora.'
      );
    }

    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['profile']
    });

    if (!user) {
      console.log('❌ Usuario no encontrado para email:', email);
      // Por seguridad, no revelar que el email no existe
      // Pero aún así aplicar rate limiting
      this.updateRateLimit(email);
      return {
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
      };
    }

    // Limpiar tokens anteriores del usuario
    await this.cleanupUserTokens(user.id);

    // Generar nuevo token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hora de expiración

    // Guardar token en la base de datos
    await this.userRepository.update(user.id, {
      resetToken: resetToken,
      resetTokenExpiry: resetTokenExpiry,
      updatedAt: new Date()
    });

    // Actualizar rate limiting
    this.updateRateLimit(email);

    console.log('✅ Token de recuperación generado para usuario:', user.id);

    // ⭐ INTENTAR ENVIAR EMAIL TANTO EN DESARROLLO COMO PRODUCCIÓN
    console.log('📧 Intentando enviar email de recuperación...');
    
    try {
      const emailSent = await this.emailService.sendPasswordResetEmail(
        user.email,
        user.profile?.firstName || 'Usuario',
        resetToken
      );

      if (emailSent) {
        console.log('✅ Email de recuperación enviado exitosamente');
      } else {
        console.error('❌ Error enviando email de recuperación');
      }
    } catch (error) {
      console.error('❌ Excepción enviando email:', error);
    }

    // En desarrollo, también retornar el token para testing
    if (process.env.NODE_ENV === 'development') {
      return {
        message: 'Token de recuperación generado y email enviado (Modo Desarrollo)',
        resetToken: resetToken // Solo para desarrollo
      };
    }

    // En producción, mensaje genérico
    return {
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
    };
  }

  // ⭐ VALIDAR TOKEN DE RECUPERACIÓN
  async validateResetToken(token: string): Promise<{ valid: boolean; user?: User }> {
    console.log('🔍 Validando token de recuperación');

    if (!token || token.length !== 64) { // Los tokens hex de 32 bytes tienen 64 caracteres
      return { valid: false };
    }

    const user = await this.userRepository.findOne({
      where: {
        resetToken: token,
        isActive: true
      },
      relations: ['profile']
    });

    if (!user) {
      console.log('❌ Token no encontrado o usuario inactivo');
      return { valid: false };
    }

    // Verificar que el token no haya expirado
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      console.log('❌ Token expirado para usuario:', user.id);
      
      // Limpiar token expirado
      await this.cleanupUserTokens(user.id);
      
      return { valid: false };
    }

    console.log('✅ Token válido para usuario:', user.id);
    return { valid: true, user };
  }

  // ⭐ RESETEAR CONTRASEÑA
  async resetPassword(resetData: PasswordResetConfirm): Promise<{ message: string }> {
    console.log('🔐 Procesando reset de contraseña');

    const { token, newPassword, confirmPassword } = resetData;

    // Validaciones
    if (!token || !newPassword || !confirmPassword) {
      throw new BadRequestException('Todos los campos son obligatorios');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    if (newPassword.length > 50) {
      throw new BadRequestException('La contraseña no puede tener más de 50 caracteres');
    }

    // Validaciones adicionales de seguridad
    if (this.isWeakPassword(newPassword)) {
      throw new BadRequestException(
        'La contraseña es muy débil. Usa una combinación de letras, números y símbolos.'
      );
    }

    // Validar token
    const tokenValidation = await this.validateResetToken(token);
    if (!tokenValidation.valid || !tokenValidation.user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const user = tokenValidation.user;

    // Verificar que la nueva contraseña no sea igual a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12); // Incrementar rounds para mayor seguridad

    // Actualizar contraseña y limpiar tokens de reset
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date()
    });

    console.log('✅ Contraseña actualizada exitosamente para usuario:', user.id);

    return {
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    };
  }

  // ⭐ LIMPIAR TOKENS EXPIRADOS (TAREA PROGRAMADA)
  async cleanupExpiredTokens(): Promise<{ cleaned: number }> {
    console.log('🧹 Limpiando tokens de reset expirados');

    const result = await this.userRepository.createQueryBuilder()
      .update(User)
      .set({
        resetToken: null,
        resetTokenExpiry: null
      })
      .where('resetTokenExpiry < :now OR resetTokenExpiry IS NULL', { now: new Date() })
      .execute();

    const totalCleaned = result.affected || 0;
    console.log('✅ Tokens limpiados:', totalCleaned);

    return { cleaned: totalCleaned };
  }

  // ⭐ MÉTODOS PRIVADOS DE UTILIDAD

  private async cleanupUserTokens(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      resetToken: null,
      resetTokenExpiry: null
    });
  }

  private checkRateLimit(email: string): boolean {
    const now = new Date();
    const entry = this.rateLimitMap.get(email);

    if (!entry) {
      return true;
    }

    // Si ha pasado más de una hora, resetear el contador
    if (now.getTime() - entry.lastRequest.getTime() > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.delete(email);
      return true;
    }

    // Verificar si ha excedido el límite
    return entry.count < this.MAX_REQUESTS_PER_HOUR;
  }

  private updateRateLimit(email: string): void {
    const now = new Date();
    const entry = this.rateLimitMap.get(email);

    if (!entry || now.getTime() - entry.lastRequest.getTime() > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(email, { count: 1, lastRequest: now });
    } else {
      entry.count++;
      entry.lastRequest = now;
    }
  }

  private isWeakPassword(password: string): boolean {
    // Lista de contraseñas comunes y débiles
    const weakPasswords = [
      '123456', 'password', '123456789', 'qwerty', 'abc123',
      'password123', '111111', '123123', 'admin', 'root'
    ];

    const lowerPassword = password.toLowerCase();
    
    // Verificar contraseñas comunes
    if (weakPasswords.includes(lowerPassword)) {
      return true;
    }

    // Verificar patrones simples
    if (/^(.)\1+$/.test(password)) { // Todos los caracteres iguales
      return true;
    }

    if (/^(012|123|234|345|456|567|678|789|890)+/.test(password)) { // Secuencias numéricas
      return true;
    }

    // Para contraseñas más largas, requerir más variedad
    if (password.length >= 8) {
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      const varietyCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
      
      if (varietyCount < 2) {
        return true;
      }
    }

    return false;
  }

  // ⭐ MÉTODO PARA TESTING DE EMAIL
  async testEmailConfiguration(): Promise<boolean> {
    return await this.emailService.testConnection();
  }
}