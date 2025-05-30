// backend/src/users/users.service.ts - Actualizado con filtro por ficha
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Ficha } from '../config/entities/ficha.entity';

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
    fichaId?: number; // Para aprendices
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
    fichaId?: number; // Para aprendices
  };
}

// ⭐ NUEVA INTERFAZ PARA FILTROS
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  typeId?: number;
  fichaId?: number; // ⭐ NUEVO FILTRO
  regionalId?: number;
  centerId?: number;
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
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, filters: UserFilters = {}) {
    const skip = (page - 1) * limit;
    
    // Construir query con filtros
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('profile.type', 'type')
      .leftJoinAndSelect('profile.regional', 'regional')
      .leftJoinAndSelect('profile.center', 'center')
      .leftJoinAndSelect('profile.ficha', 'ficha') // ⭐ INCLUIR FICHA
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    // ⭐ APLICAR FILTROS
    if (filters.search) {
      query.andWhere(
        '(profile.firstName LIKE :search OR profile.lastName LIKE :search OR profile.documentNumber LIKE :search OR user.email LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.role) {
      query.andWhere('role.name = :role', { role: filters.role });
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    if (filters.typeId) {
      query.andWhere('profile.typeId = :typeId', { typeId: filters.typeId });
    }

    // ⭐ FILTRO POR FICHA - Solo para aprendices
    if (filters.fichaId) {
      query.andWhere('profile.fichaId = :fichaId', { fichaId: filters.fichaId });
      query.andWhere('role.name = :roleName', { roleName: 'Aprendiz' });
    }

    if (filters.regionalId) {
      query.andWhere('profile.regionalId = :regionalId', { regionalId: filters.regionalId });
    }

    if (filters.centerId) {
      query.andWhere('profile.centerId = :centerId', { centerId: filters.centerId });
    }

    const [users, total] = await query.getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ⭐ NUEVO MÉTODO - Obtener fichas para el filtro
  async getFichas() {
    return this.fichaRepository.find({
      order: { code: 'ASC' },
      select: ['id', 'code', 'name', 'status'],
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'profile', 'profile.type', 'profile.regional', 'profile.center', 'profile.ficha'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    // Verificar que el email no exista
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }

    // Verificar que el documento no exista
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
    
    // Soft delete - marcar como inactivo
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

    // ⭐ NUEVO - Aprendices por ficha
    const learnersByFicha = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.ficha', 'ficha')
      .select('ficha.code', 'fichaCode')
      .addSelect('ficha.name', 'fichaName')
      .addSelect('COUNT(user.id)', 'count')
      .where('role.name = :roleName', { roleName: 'Aprendiz' })
      .andWhere('ficha.id IS NOT NULL')
      .groupBy('ficha.id')
      .getRawMany();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      learnersByFicha, // ⭐ NUEVA ESTADÍSTICA
    };
  }
}