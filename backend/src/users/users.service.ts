// src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from '../profiles/entities/profile.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  roleId: number;
  profile: {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    typeId: number;
    regionalId: number;
    centerId: number;
  };
}

export interface UpdateUserDto {
  email?: string;
  roleId?: number;
  isActive?: boolean;
  profile?: {
    documentType?: string;
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    typeId?: number;
    regionalId?: number;
    centerId?: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['role', 'profile', 'profile.type', 'profile.regional', 'profile.center'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'profile', 'profile.type', 'profile.regional', 'profile.center'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }

    // Verificar si el documento ya existe
    const existingProfile = await this.profileRepository.findOne({
      where: { documentNumber: createUserDto.profile.documentNumber },
    });

    if (existingProfile) {
      throw new ConflictException('El número de documento ya está en uso');
    }

    // Verificar que el rol exista
    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = await this.userRepository.save({
      email: createUserDto.email,
      password: hashedPassword,
      roleId: createUserDto.roleId,
      isActive: true,
    });

    // Crear perfil
    await this.profileRepository.save({
      ...createUserDto.profile,
      userId: user.id,
    });

    return this.findOne(user.id);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Verificar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Actualizar usuario
    if (updateUserDto.email || updateUserDto.roleId !== undefined || updateUserDto.isActive !== undefined) {
      await this.userRepository.update(id, {
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.roleId && { roleId: updateUserDto.roleId }),
        ...(updateUserDto.isActive !== undefined && { isActive: updateUserDto.isActive }),
      });
    }

    // Actualizar perfil si se proporciona
    if (updateUserDto.profile) {
      await this.profileRepository.update(
        { userId: id },
        updateUserDto.profile,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    
    // Soft delete - marcar como inactivo en lugar de eliminar
    await this.userRepository.update(id, { isActive: false });

    return { message: `Usuario ${user.profile.firstName} ${user.profile.lastName} desactivado correctamente` };
  }

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;

    // Usuarios por rol
    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select('role.name', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('role.name')
      .getRawMany();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
    };
  }
}