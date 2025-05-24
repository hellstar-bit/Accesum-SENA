// backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(AccessRecord)
    private accessRecordRepository: Repository<AccessRecord>,
    @InjectRepository(PersonnelType)
    private personnelTypeRepository: Repository<PersonnelType>,
  ) {}

  async getDashboardStats() {
    // Total de usuarios
    const totalUsers = await this.userRepository.count();
    
    // Usuarios activos
    const activeUsers = await this.userRepository.count({ 
      where: { isActive: true } 
    });

    // Accesos de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAccess = await this.accessRecordRepository
      .createQueryBuilder('access')
      .where('access.entryTime >= :today', { today })
      .getCount();

    // Total de perfiles
    const totalProfiles = await this.profileRepository.count();

    // Usuarios por tipo de personal
    const usersByType = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.type', 'type')
      .select('type.name', 'typeName')
      .addSelect('COUNT(profile.id)', 'count')
      .groupBy('type.name')
      .getRawMany();

    // Formatear usuarios por tipo
    const usersByTypeFormatted = {
      funcionarios: 0,
      contratistas: 0,
      aprendices: 0,
      visitantes: 0,
    };

    usersByType.forEach(item => {
      const typeName = item.typeName.toLowerCase();
      if (typeName === 'funcionario') usersByTypeFormatted.funcionarios = parseInt(item.count);
      else if (typeName === 'contratista') usersByTypeFormatted.contratistas = parseInt(item.count);
      else if (typeName === 'aprendiz') usersByTypeFormatted.aprendices = parseInt(item.count);
      else if (typeName === 'visitante') usersByTypeFormatted.visitantes = parseInt(item.count);
    });

    return {
      totalUsers,
      activeUsers,
      todayAccess,
      totalProfiles,
      usersByType: usersByTypeFormatted,
    };
  }

  async getRecentActivity(limit: number = 10) {
    const recentAccess = await this.accessRecordRepository
      .createQueryBuilder('access')
      .leftJoinAndSelect('access.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('access.entryTime', 'DESC')
      .limit(limit)
      .getMany();

    return recentAccess.map(access => ({
      id: access.id,
      user: `${access.user.profile.firstName} ${access.user.profile.lastName}`,
      type: access.status,
      time: access.entryTime,
      exitTime: access.exitTime,
    }));
  }

  async getUserGrowth() {
    // Obtener crecimiento de usuarios en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userGrowth = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_FORMAT(user.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return userGrowth;
  }

  async getUsersByRole() {
    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select('role.name', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('role.name')
      .getRawMany();

    return usersByRole;
  }
}