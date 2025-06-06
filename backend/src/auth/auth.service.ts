// backend/src/auth/auth.service.ts - COMPLETO
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private jwtService: JwtService,
  ) {}

  // ⭐ LOGIN
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Buscar usuario con todas las relaciones necesarias
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: [
        'role',
        'profile',
        'profile.type',
        'profile.regional',
        'profile.center',
        'profile.coordination',
        'profile.program',
        'profile.ficha',
        'profile.ficha.program'
      ]
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role.name 
    };

    const access_token = this.jwtService.sign(payload);

    // Remover password del objeto user antes de enviarlo
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword as User
    };
  }

  // ⭐ OBTENER PERFIL ACTUAL
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: [
        'role',
        'profile',
        'profile.type',
        'profile.regional',
        'profile.center',
        'profile.coordination',
        'profile.program',
        'profile.ficha',
        'profile.ficha.program'
      ]
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Remover password del objeto user
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // ⭐ VALIDAR USUARIO (para JWT Strategy)
  async validateUser(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: [
        'role',
        'profile',
        'profile.type',
        'profile.regional',
        'profile.center',
        'profile.coordination',
        'profile.program',
        'profile.ficha'
      ]
    });

    if (!user) {
      return null;
    }

    // Remover password del objeto user
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // ⭐ CAMBIAR CONTRASEÑA
  async changePassword(
    userId: number, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await this.userRepository.update(userId, {
      password: hashedNewPassword
    });
  }

  // ⭐ LOGOUT (opcional - para invalidar tokens en el futuro)
  async logout(userId: number): Promise<void> {
    // Por ahora, el logout se maneja en el frontend eliminando el token
    // En el futuro se puede implementar una blacklist de tokens
    console.log(`Usuario ${userId} ha cerrado sesión`);
  }
}