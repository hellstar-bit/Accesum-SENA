import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Competence } from '../config/entities/competence.entity';
import * as bcrypt from 'bcrypt';

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
    address?: string;
    city?: string;
    typeId: number;
    regionalId: number;
    centerId: number;
    coordinationId?: number;
    programId?: number;
    fichaId?: number;
  };
}

export interface UpdateUserDto {
  email?: string;
  isActive?: boolean;
  roleId?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    typeId?: number;
    regionalId?: number;
    centerId?: number;
    coordinationId?: number;
    programId?: number;
    fichaId?: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    
    @InjectRepository(Ficha)
    private readonly fichaRepository: Repository<Ficha>,
    
    @InjectRepository(Competence)
    private readonly competenceRepository: Repository<Competence>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .leftJoinAndSelect('profile.regional', 'regional')
        .leftJoinAndSelect('profile.center', 'center')
        .leftJoinAndSelect('profile.coordination', 'coordination')
        .leftJoinAndSelect('profile.program', 'program')
        .leftJoinAndSelect('profile.ficha', 'ficha');

      // Aplicar filtros
      if (filters.search) {
        queryBuilder.andWhere(
          '(profile.firstName LIKE :search OR profile.lastName LIKE :search OR user.email LIKE :search OR profile.documentNumber LIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.role) {
        queryBuilder.andWhere('role.name = :role', { role: filters.role });
      }

      if (filters.status) {
        const isActive = filters.status === 'active';
        queryBuilder.andWhere('user.isActive = :isActive', { isActive });
      }

      if (filters.typeId) {
        queryBuilder.andWhere('profile.typeId = :typeId', { typeId: filters.typeId });
      }

      if (filters.fichaId) {
        queryBuilder.andWhere('profile.fichaId = :fichaId', { fichaId: filters.fichaId });
      }

      if (filters.regionalId) {
        queryBuilder.andWhere('profile.regionalId = :regionalId', { regionalId: filters.regionalId });
      }

      if (filters.centerId) {
        queryBuilder.andWhere('profile.centerId = :centerId', { centerId: filters.centerId });
      }

      const [users, total] = await queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        users,
        data: users,
        total,
        count: users.length,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
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
          'profile.coordination',
          'profile.program',
          'profile.ficha'
        ]
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      return user;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('El email ya está en uso');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Crear usuario
      const user = this.userRepository.create({
        email: createUserDto.email,
        password: hashedPassword,
        roleId: createUserDto.roleId,
        isActive: true
      });

      const savedUser = await this.userRepository.save(user);

      // Crear perfil
      const profile = this.profileRepository.create({
        ...createUserDto.profile,
        userId: savedUser.id
      });

      await this.profileRepository.save(profile);

      return await this.findOne(savedUser.id);
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findOne(id);

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email }
        });

        if (existingUser) {
          throw new ConflictException('El email ya está en uso por otro usuario');
        }
      }

      // Actualizar usuario
      if (updateUserDto.email) user.email = updateUserDto.email;
      if (typeof updateUserDto.isActive === 'boolean') user.isActive = updateUserDto.isActive;
      if (updateUserDto.roleId) user.roleId = updateUserDto.roleId;

      await this.userRepository.save(user);

      // Actualizar perfil si se proporciona
      if (updateUserDto.profile && user.profile) {
        Object.assign(user.profile, updateUserDto.profile);
        await this.profileRepository.save(user.profile);
      }

      return await this.findOne(id);
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
      return { message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      console.error('Error en remove:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { isActive: true } });
      const inactiveUsers = totalUsers - activeUsers;

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
        usersByRole
      };
    } catch (error) {
      console.error('Error en getStats:', error);
      throw error;
    }
  }

  async getFichas() {
    try {
      console.log('📋 Obteniendo fichas...');
      
      const fichas = await this.fichaRepository.find({
        where: { 
          status: In(['EN EJECUCIÓN', 'EN FORMACION']) 
        },
        order: { code: 'ASC' }
      });

      console.log('📋 Fichas encontradas:', fichas.length);
      return fichas;
    } catch (error) {
      console.error('❌ Error al obtener fichas:', error);
      return [];
    }
  }

  // ⭐ NUEVOS MÉTODOS PARA HORARIOS POR TRIMESTRE
  async getInstructorsWithCompetences() {
    try {
      console.log('📋 Obteniendo instructores con competencias...');
      
      const instructors = await this.userRepository.find({
        where: {
          role: { name: 'Instructor' },
          isActive: true
        },
        relations: ['profile', 'competences'],
        select: {
          id: true,
          email: true,
          profile: {
            firstName: true,
            lastName: true
          }
        }
      });

      const formattedInstructors = instructors.map(instructor => ({
        id: instructor.id,
        name: `${instructor.profile?.firstName || ''} ${instructor.profile?.lastName || ''}`.trim(),
        email: instructor.email,
        competences: instructor.competences || [],
        assignments: []
      }));

      console.log('📋 Instructores encontrados:', formattedInstructors.length);
      return formattedInstructors;
    } catch (error) {
      console.error('❌ Error al obtener instructores con competencias:', error);
      return [];
    }
  }

  async getFichasWithCompetences() {
    try {
      console.log('📋 Obteniendo fichas con competencias...');
      
      const fichas = await this.fichaRepository.find({
        where: { 
          status: In(['EN EJECUCIÓN', 'EN FORMACION']) 
        },
        relations: ['program', 'program.competences'],
        order: { code: 'ASC' }
      });

      const formattedFichas = fichas.map(ficha => ({
        id: ficha.id,
        code: ficha.code,
        name: ficha.name,
        status: ficha.status,
        programId: ficha.programId,
        competences: ficha.program?.competences || []
      }));

      console.log('📋 Fichas encontradas:', formattedFichas.length);
      return formattedFichas;
    } catch (error) {
      console.error('❌ Error al obtener fichas con competencias:', error);
      return [];
    }
  }

  async getAllCompetences() {
    try {
      console.log('📋 Obteniendo todas las competencias...');
      
      const competences = await this.competenceRepository.find({
        where: { isActive: true },
        relations: ['program'],
        order: { code: 'ASC' }
      });

      console.log('📋 Competencias encontradas:', competences.length);
      return competences;
    } catch (error) {
      console.error('❌ Error al obtener competencias:', error);
      return [];
    }
  }
}
