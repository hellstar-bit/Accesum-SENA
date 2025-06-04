// backend/src/users/users.service.ts - CORREGIDO PARA MYSQL
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
    fichaId?: number;
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
    fichaId?: number;
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  typeId?: number;
  fichaId?: number;
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
    try {
      console.log('🔍 findAll llamado con:', { page, limit, filters });

      const skip = (page - 1) * limit;
      
      // Query base simple
      let query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .leftJoinAndSelect('profile.regional', 'regional')
        .leftJoinAndSelect('profile.center', 'center')
        .leftJoinAndSelect('profile.ficha', 'ficha')
        .skip(skip)
        .take(limit)
        .orderBy('user.id', 'DESC');

      // 🔧 CORREGIDO: Usar LIKE en lugar de ILIKE para MySQL
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        console.log('🔍 Aplicando filtro de búsqueda:', searchTerm);
        
        // Para MySQL: usar LIKE con LOWER() para hacer búsqueda case-insensitive
        query = query.andWhere(
          '(LOWER(profile.firstName) LIKE LOWER(:search) OR LOWER(profile.lastName) LIKE LOWER(:search) OR LOWER(profile.documentNumber) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
          { search: `%${searchTerm}%` }
        );
      }

      // Filtro de rol
      if (filters.role && filters.role.trim()) {
        console.log('🔍 Aplicando filtro de rol:', filters.role);
        query = query.andWhere('role.name = :role', { role: filters.role });
      }

      // Filtro de estado
      if (filters.status) {
        console.log('🔍 Aplicando filtro de estado:', filters.status);
        const isActive = filters.status === 'active';
        query = query.andWhere('user.isActive = :isActive', { isActive });
      }

      // Filtro de ficha
      if (filters.fichaId && !isNaN(Number(filters.fichaId))) {
        console.log('🔍 Aplicando filtro de ficha:', filters.fichaId);
        query = query.andWhere('profile.fichaId = :fichaId', { fichaId: Number(filters.fichaId) });
      }

      // Filtro de tipo
      if (filters.typeId && !isNaN(Number(filters.typeId))) {
        console.log('🔍 Aplicando filtro de tipo:', filters.typeId);
        query = query.andWhere('profile.typeId = :typeId', { typeId: Number(filters.typeId) });
      }

      // Filtro de regional
      if (filters.regionalId && !isNaN(Number(filters.regionalId))) {
        console.log('🔍 Aplicando filtro de regional:', filters.regionalId);
        query = query.andWhere('profile.regionalId = :regionalId', { regionalId: Number(filters.regionalId) });
      }

      // Filtro de centro
      if (filters.centerId && !isNaN(Number(filters.centerId))) {
        console.log('🔍 Aplicando filtro de centro:', filters.centerId);
        query = query.andWhere('profile.centerId = :centerId', { centerId: Number(filters.centerId) });
      }

      console.log('🔍 Ejecutando query...');
      
      const [users, total] = await query.getManyAndCount();

      console.log(`✅ Query exitosa: ${users.length} usuarios de ${total} total`);

      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      console.error('❌ Error detallado en findAll:', {
        message: error.message,
        stack: error.stack,
        filters,
        page,
        limit
      });
      
      // Re-lanzar con mensaje más claro
      throw new Error(`Error en consulta de usuarios: ${error.message}`);
    }
  }

  async getFichas() {
    try {
      console.log('📋 Obteniendo fichas...');
      
      const fichas = await this.fichaRepository.find({
        select: ['id', 'code', 'name', 'status'],
        order: { code: 'ASC' },
      });
      
      console.log(`📋 Fichas encontradas: ${fichas.length}`);
      return fichas;
      
    } catch (error) {
      console.error('❌ Error al obtener fichas:', error);
      return [];
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: [
          'role', 
          'profile', 
          'profile.type', 
          'profile.regional', 
          'profile.center', 
          'profile.ficha'
        ],
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return user;
    } catch (error) {
      console.error(`❌ Error al buscar usuario ${id}:`, error);
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
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
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
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
    } catch (error) {
      console.error(`❌ Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const user = await this.findOne(id);
      
      // Soft delete - marcar como inactivo
      await this.userRepository.update(id, { isActive: false });

      return { 
        message: `Usuario ${user.profile.firstName} ${user.profile.lastName} desactivado correctamente` 
      };
    } catch (error) {
      console.error(`❌ Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }

  async getStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { isActive: true } });
      const inactiveUsers = totalUsers - activeUsers;

      // Usuarios por rol - versión simplificada
      const usersByRole = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select('role.name', 'role')
        .addSelect('COUNT(user.id)', 'count')
        .groupBy('role.name')
        .getRawMany();

      // Aprendices por ficha - versión simplificada
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
        .groupBy('ficha.id, ficha.code, ficha.name')
        .getRawMany();

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        learnersByFicha,
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      // Retornar datos básicos en caso de error
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: [],
        learnersByFicha: [],
      };
    }
  }
}