// backend/src/auth/auth.module.ts - ORDEN CORREGIDO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { PasswordResetService } from './password-reset.service';
import { EmailService } from '../common/services/email.service';

console.log('🔑 AuthModule - JWT_SECRET del .env:', process.env.JWT_SECRET || 'NO DEFINIDO');

// ⭐ MOVER EL @Module AL FINAL DEL ARCHIVO
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'accesum_secret_key',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRATION || '24h'
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    EmailService,
    PasswordResetService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    EmailService,
    PasswordResetService,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}