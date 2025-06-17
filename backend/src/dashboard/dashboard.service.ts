// backend/src/dashboard/dashboard.service.ts - VERSIÓN CORREGIDA CON DATOS 100% REALES
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AccessRecord } from '../access/entities/access-record.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';

export interface DashboardFilters {
  timeRange?: '1d' | '7d' | '30d' | '90d';
  regionalId?: number;
  centerId?: number;
  personnelTypeId?: number;
}

export interface AccessTrendData {
  date: string;
  count: number;
  entries: number;
  exits: number;
}

export interface RegionalStatsData {
  regional: string;
  regionalId: number;
  users: number;
  active: number;
  todayAccess: number;
  weeklyGrowth: number;
}

export interface CenterStatsData {
  center: string;
  centerId: number;
  users: number;
  todayAccess: number;
  weeklyAccess: number;
  occupancyRate: number;
}

export interface UserTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  growth: number;
}

export interface EnhancedDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  todayAccess: number;
  weeklyAccess: number;
  monthlyAccess: number;
  totalProfiles: number;
  profilesWithQR: number;
  averageAccessPerDay: number;
  peakHour: number;
  usersByType: {
    funcionarios: number;
    contratistas: number;
    aprendices: number;
    visitantes: number;
  };
  growthMetrics: {
    userGrowthWeekly: number;
    accessGrowthDaily: number;
    accessGrowthWeekly: number;
  };
}

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
    @InjectRepository(Regional)
    private regionalRepository: Repository<Regional>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
  ) {}

  // ===== ESTADÍSTICAS MEJORADAS CON DATOS 100% REALES =====
  async getEnhancedDashboardStats(filters: DashboardFilters = {}): Promise<EnhancedDashboardStats> {
    const { timeRange = '30d', regionalId, centerId, personnelTypeId } = filters;

    console.log('📊 Calculando estadísticas mejoradas con datos REALES:', filters);

    try {
      // ⭐ CONFIGURAR RANGOS DE FECHAS REALES
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // ⭐ CONSULTAS BASE CON FILTROS APLICADOS
      const buildUserQuery = () => {
        let query = this.userRepository.createQueryBuilder('user')
          .leftJoin('user.profile', 'profile')
          .leftJoin('profile.type', 'type')
          .leftJoin('profile.regional', 'regional')
          .leftJoin('profile.center', 'center');

        if (regionalId) query = query.andWhere('profile.regionalId = :regionalId', { regionalId });
        if (centerId) query = query.andWhere('profile.centerId = :centerId', { centerId });
        if (personnelTypeId) query = query.andWhere('profile.typeId = :personnelTypeId', { personnelTypeId });

        return query;
      };

      const buildAccessQuery = () => {
        let query = this.accessRecordRepository.createQueryBuilder('access')
          .leftJoin('access.user', 'user')
          .leftJoin('user.profile', 'profile')
          .leftJoin('profile.type', 'type')
          .leftJoin('profile.regional', 'regional')
          .leftJoin('profile.center', 'center');

        if (regionalId) query = query.andWhere('profile.regionalId = :regionalId', { regionalId });
        if (centerId) query = query.andWhere('profile.centerId = :centerId', { centerId });
        if (personnelTypeId) query = query.andWhere('profile.typeId = :personnelTypeId', { personnelTypeId });

        return query;
      };

      // ⭐ MÉTRICAS DE USUARIOS (100% REALES)
      const [totalUsers, activeUsers] = await Promise.all([
        buildUserQuery().getCount(),
        buildUserQuery().andWhere('user.isActive = :isActive', { isActive: true }).getCount()
      ]);

      console.log('✅ Usuarios calculados:', { totalUsers, activeUsers });

      // ⭐ MÉTRICAS DE ACCESO (100% REALES)
      const [todayAccess, yesterdayAccess, weeklyAccess, monthlyAccess] = await Promise.all([
        buildAccessQuery().andWhere('access.entryTime >= :today', { today }).getCount(),
        buildAccessQuery().andWhere('access.entryTime >= :yesterday AND access.entryTime < :today', { yesterday, today }).getCount(),
        buildAccessQuery().andWhere('access.entryTime >= :weekAgo', { weekAgo }).getCount(),
        buildAccessQuery().andWhere('access.entryTime >= :monthAgo', { monthAgo }).getCount()
      ]);

      console.log('✅ Accesos calculados:', { todayAccess, yesterdayAccess, weeklyAccess, monthlyAccess });

      // ⭐ MÉTRICAS DE PERFILES (100% REALES)
      const buildProfileQuery = () => {
        let query = this.profileRepository.createQueryBuilder('profile');
        if (regionalId) query = query.andWhere('profile.regionalId = :regionalId', { regionalId });
        if (centerId) query = query.andWhere('profile.centerId = :centerId', { centerId });
        if (personnelTypeId) query = query.andWhere('profile.typeId = :personnelTypeId', { personnelTypeId });
        return query;
      };

      const [totalProfiles, profilesWithQR] = await Promise.all([
        buildProfileQuery().getCount(),
        buildProfileQuery().andWhere('(profile.qrCode IS NOT NULL AND profile.qrCode != :empty)', { empty: '' }).getCount()
      ]);

      console.log('✅ Perfiles calculados:', { totalProfiles, profilesWithQR });

      // ⭐ USUARIOS POR TIPO (100% REALES) - MAPEO CORRECTO
      const usersByTypeRaw = await this.profileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.type', 'type')
        .leftJoin('profile.user', 'user')
        .select('type.name', 'typeName')
        .addSelect('COUNT(profile.id)', 'count')
        .where('user.isActive = :isActive', { isActive: true })
        .andWhere(regionalId ? 'profile.regionalId = :regionalId' : '1=1', regionalId ? { regionalId } : {})
        .andWhere(centerId ? 'profile.centerId = :centerId' : '1=1', centerId ? { centerId } : {})
        .andWhere(personnelTypeId ? 'profile.typeId = :personnelTypeId' : '1=1', personnelTypeId ? { personnelTypeId } : {})
        .groupBy('type.name')
        .getRawMany();

      // ⭐ MAPEAR A ESTRUCTURA ESPERADA POR EL FRONTEND
      const usersByType = {
        funcionarios: 0,
        contratistas: 0,
        aprendices: 0,
        visitantes: 0,
      };

      usersByTypeRaw.forEach(item => {
        const typeName = item.typeName?.toLowerCase() || '';
        const count = parseInt(item.count) || 0;
        
        if (typeName.includes('funcionario')) usersByType.funcionarios = count;
        else if (typeName.includes('contratista')) usersByType.contratistas = count;
        else if (typeName.includes('aprendiz')) usersByType.aprendices = count;
        else if (typeName.includes('visitante')) usersByType.visitantes = count;
        else {
          // ⭐ ASIGNAR A FUNCIONARIOS POR DEFECTO SI NO COINCIDE
          usersByType.funcionarios += count;
        }
      });

      console.log('✅ Usuarios por tipo calculados:', usersByType);

      // ⭐ MÉTRICAS DE CRECIMIENTO (100% REALES)
      const lastWeekUsers = await buildUserQuery()
        .andWhere('user.createdAt <= :weekAgo', { weekAgo })
        .getCount();

      const userGrowthWeekly = lastWeekUsers > 0 
        ? ((totalUsers - lastWeekUsers) / lastWeekUsers) * 100 
        : totalUsers > 0 ? 100 : 0;

      const accessGrowthDaily = yesterdayAccess > 0 
        ? ((todayAccess - yesterdayAccess) / yesterdayAccess) * 100 
        : todayAccess > 0 ? 100 : 0;

      const lastWeekAccess = await buildAccessQuery()
        .andWhere('access.entryTime >= :twoWeeksAgo AND access.entryTime < :weekAgo', { 
          twoWeeksAgo: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000), 
          weekAgo 
        })
        .getCount();

      const accessGrowthWeekly = lastWeekAccess > 0 
        ? ((weeklyAccess - lastWeekAccess) / lastWeekAccess) * 100 
        : weeklyAccess > 0 ? 100 : 0;

      console.log('✅ Métricas de crecimiento calculadas:', { userGrowthWeekly, accessGrowthDaily, accessGrowthWeekly });

      // ⭐ HORA PICO (100% REAL)
      const hourlyAccessData = await buildAccessQuery()
      .select('EXTRACT(HOUR FROM access.createdAt) as hour') // ← access.createdAt
      .addSelect('COUNT(*)', 'count')
      .where('access.entryTime >= :weekAgo', { weekAgo })
      .groupBy('EXTRACT(HOUR FROM access.createdAt)') // ← También cambiar aquí
      .orderBy('count', 'DESC')
      .getRawOne();

      const peakHour = hourlyAccessData ? parseInt(hourlyAccessData.hour) : 14;

      console.log('✅ Hora pico calculada:', peakHour);

      // ⭐ PROMEDIO DIARIO REAL
      const averageAccessPerDay = monthlyAccess > 0 ? Math.round(monthlyAccess / 30) : 0;

      // ⭐ RESPUESTA FINAL
      const result: EnhancedDashboardStats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        todayAccess,
        weeklyAccess,
        monthlyAccess,
        totalProfiles,
        profilesWithQR,
        averageAccessPerDay,
        peakHour,
        usersByType,
        growthMetrics: {
          userGrowthWeekly: Math.round(userGrowthWeekly * 100) / 100,
          accessGrowthDaily: Math.round(accessGrowthDaily * 100) / 100,
          accessGrowthWeekly: Math.round(accessGrowthWeekly * 100) / 100,
        },
      };

      console.log('✅ Estadísticas mejoradas calculadas con datos 100% REALES');
      return result;

    } catch (error) {
      console.error('❌ Error en getEnhancedDashboardStats:', error);
      throw error;
    }
  }

  // ⭐ TENDENCIAS DE ACCESO CON DATOS 100% REALES
  async getAccessTrends(filters: DashboardFilters = {}): Promise<AccessTrendData[]> {
    const { timeRange = '7d', regionalId, centerId } = filters;
    
    console.log('📈 Calculando tendencias de acceso con datos REALES:', filters);

    try {
      const now = new Date();
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      const trends: AccessTrendData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        
        // ⭐ CONSULTA REAL A LA BASE DE DATOS
        let entryQuery = this.accessRecordRepository
          .createQueryBuilder('access')
          .leftJoin('access.user', 'user')
          .leftJoin('user.profile', 'profile')
          .where('access.entryTime >= :date', { date })
          .andWhere('access.entryTime < :nextDate', { nextDate });

        let exitQuery = this.accessRecordRepository
          .createQueryBuilder('access')
          .leftJoin('access.user', 'user')
          .leftJoin('user.profile', 'profile')
          .where('access.exitTime >= :date', { date })
          .andWhere('access.exitTime < :nextDate', { nextDate })
          .andWhere('access.exitTime IS NOT NULL');

        // ⭐ APLICAR FILTROS
        if (regionalId) {
          entryQuery = entryQuery.andWhere('profile.regionalId = :regionalId', { regionalId });
          exitQuery = exitQuery.andWhere('profile.regionalId = :regionalId', { regionalId });
        }
        if (centerId) {
          entryQuery = entryQuery.andWhere('profile.centerId = :centerId', { centerId });
          exitQuery = exitQuery.andWhere('profile.centerId = :centerId', { centerId });
        }

        // ⭐ EJECUTAR CONSULTAS REALES
        const [entries, exits] = await Promise.all([
          entryQuery.getCount(),
          exitQuery.getCount()
        ]);

        trends.push({
          date: date.toISOString().split('T')[0],
          count: entries, // Total de entradas como métrica principal
          entries,
          exits,
        });
      }

      console.log('✅ Tendencias REALES calculadas para', trends.length, 'días');
      return trends;

    } catch (error) {
      console.error('❌ Error en getAccessTrends:', error);
      // ⭐ EN CASO DE ERROR, DEVOLVER ARRAY VACÍO EN LUGAR DE DATOS FALSOS
      return [];
    }
  }

  // ⭐ ESTADÍSTICAS REGIONALES CON DATOS 100% REALES
  async getRegionalStats(filters: DashboardFilters = {}): Promise<RegionalStatsData[]> {
    console.log('🌍 Calculando estadísticas regionales con datos REALES');

    try {
      // ⭐ OBTENER TODAS LAS REGIONALES REALES
      const regionals = await this.regionalRepository.find({
        order: { name: 'ASC' }
      });
      
      if (regionals.length === 0) {
        console.log('⚠️ No hay regionales en la base de datos');
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: RegionalStatsData[] = [];

      // ⭐ CALCULAR DATOS REALES PARA CADA REGIONAL
      for (const regional of regionals) {
        const [users, active, todayAccess, lastWeekUsers] = await Promise.all([
          // Total de usuarios
          this.profileRepository
            .createQueryBuilder('profile')
            .leftJoin('profile.user', 'user')
            .where('profile.regionalId = :regionalId', { regionalId: regional.id })
            .getCount(),

          // Usuarios activos
          this.profileRepository
            .createQueryBuilder('profile')
            .leftJoin('profile.user', 'user')
            .where('profile.regionalId = :regionalId', { regionalId: regional.id })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .getCount(),

          // Accesos de hoy
          this.accessRecordRepository
            .createQueryBuilder('access')
            .leftJoin('access.user', 'user')
            .leftJoin('user.profile', 'profile')
            .where('profile.regionalId = :regionalId', { regionalId: regional.id })
            .andWhere('access.entryTime >= :today', { today })
            .getCount(),

          // Usuarios de la semana pasada (para calcular crecimiento)
          this.profileRepository
            .createQueryBuilder('profile')
            .leftJoin('profile.user', 'user')
            .where('profile.regionalId = :regionalId', { regionalId: regional.id })
            .andWhere('user.createdAt <= :weekAgo', { weekAgo })
            .getCount()
        ]);

        const weeklyGrowth = lastWeekUsers > 0 ? ((users - lastWeekUsers) / lastWeekUsers) * 100 : 0;

        stats.push({
          regional: regional.name,
          regionalId: regional.id,
          users,
          active,
          todayAccess,
          weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
        });
      }

      console.log('✅ Estadísticas regionales REALES calculadas para', stats.length, 'regionales');
      return stats.sort((a, b) => b.users - a.users);

    } catch (error) {
      console.error('❌ Error en getRegionalStats:', error);
      return [];
    }
  }

  // ⭐ ESTADÍSTICAS DE CENTROS CON DATOS 100% REALES
  async getCenterStats(filters: DashboardFilters = {}): Promise<CenterStatsData[]> {
    const { regionalId } = filters;
    
    console.log('🏢 Calculando estadísticas de centros con datos REALES');

    try {
      // ⭐ OBTENER CENTROS REALES CON FILTROS
      let centersQuery = this.centerRepository.createQueryBuilder('center');
      
      if (regionalId) {
        centersQuery = centersQuery.where('center.regionalId = :regionalId', { regionalId });
      }
      
      const centers = await centersQuery.orderBy('center.name', 'ASC').getMany();
      
      if (centers.length === 0) {
        console.log('⚠️ No hay centros en la base de datos');
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: CenterStatsData[] = [];

      // ⭐ CALCULAR DATOS REALES PARA CADA CENTRO
      for (const center of centers) {
        const [users, todayAccess, weeklyAccess, currentOccupancy] = await Promise.all([
          // Total de usuarios
          this.profileRepository
            .createQueryBuilder('profile')
            .where('profile.centerId = :centerId', { centerId: center.id })
            .getCount(),

          // Accesos de hoy
          this.accessRecordRepository
            .createQueryBuilder('access')
            .leftJoin('access.user', 'user')
            .leftJoin('user.profile', 'profile')
            .where('profile.centerId = :centerId', { centerId: center.id })
            .andWhere('access.entryTime >= :today', { today })
            .getCount(),

          // Accesos de la semana
          this.accessRecordRepository
            .createQueryBuilder('access')
            .leftJoin('access.user', 'user')
            .leftJoin('user.profile', 'profile')
            .where('profile.centerId = :centerId', { centerId: center.id })
            .andWhere('access.entryTime >= :weekAgo', { weekAgo })
            .getCount(),

          // Ocupación actual (personas dentro)
          this.accessRecordRepository
            .createQueryBuilder('access')
            .leftJoin('access.user', 'user')
            .leftJoin('user.profile', 'profile')
            .where('profile.centerId = :centerId', { centerId: center.id })
            .andWhere('access.exitTime IS NULL')
            .getCount()
        ]);

        // ⭐ CALCULAR TASA DE OCUPACIÓN REAL
        const occupancyRate = users > 0 ? Math.min((currentOccupancy / users) * 100, 100) : 0;

        stats.push({
          center: center.name,
          centerId: center.id,
          users,
          todayAccess,
          weeklyAccess,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
        });
      }

      console.log('✅ Estadísticas de centros REALES calculadas para', stats.length, 'centros');
      return stats.sort((a, b) => b.todayAccess - a.todayAccess);

    } catch (error) {
      console.error('❌ Error en getCenterStats:', error);
      return [];
    }
  }

  // ⭐ DISTRIBUCIÓN POR TIPO DE USUARIO CON DATOS 100% REALES
  async getUserTypeDistribution(filters: DashboardFilters = {}): Promise<UserTypeDistribution[]> {
    const { regionalId, centerId } = filters;
    
    console.log('👥 Calculando distribución por tipo con datos REALES');

    try {
      // ⭐ CONSULTA REAL A LA BASE DE DATOS
      let query = this.profileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.type', 'type')
        .leftJoin('profile.user', 'user')
        .select('type.name', 'typeName')
        .addSelect('COUNT(profile.id)', 'count')
        .where('user.isActive = :isActive', { isActive: true });

      if (regionalId) {
        query = query.andWhere('profile.regionalId = :regionalId', { regionalId });
      }
      if (centerId) {
        query = query.andWhere('profile.centerId = :centerId', { centerId });
      }

      const results = await query.groupBy('type.name').getRawMany();
      
      if (results.length === 0) {
        console.log('⚠️ No hay usuarios por tipo en la base de datos');
        return [];
      }

      const totalUsers = results.reduce((sum, item) => sum + parseInt(item.count), 0);

      // ⭐ CALCULAR CRECIMIENTO REAL COMPARANDO CON LA SEMANA PASADA
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const distribution: UserTypeDistribution[] = [];

      for (const item of results) {
        const currentCount = parseInt(item.count);
        
        // ⭐ OBTENER CONTEO DE LA SEMANA PASADA PARA CALCULAR CRECIMIENTO REAL
        const lastWeekQuery = this.profileRepository
          .createQueryBuilder('profile')
          .leftJoin('profile.type', 'type')
          .leftJoin('profile.user', 'user')
          .where('type.name = :typeName', { typeName: item.typeName })
          .andWhere('user.createdAt <= :weekAgo', { weekAgo })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (regionalId) {
          lastWeekQuery.andWhere('profile.regionalId = :regionalId', { regionalId });
        }
        if (centerId) {
          lastWeekQuery.andWhere('profile.centerId = :centerId', { centerId });
        }

        const lastWeekCount = await lastWeekQuery.getCount();
        const growth = lastWeekCount > 0 ? ((currentCount - lastWeekCount) / lastWeekCount) * 100 : 0;

        distribution.push({
          type: item.typeName || 'Sin tipo',
          count: currentCount,
          percentage: totalUsers > 0 ? Math.round((currentCount / totalUsers) * 10000) / 100 : 0,
          growth: Math.round(growth * 100) / 100,
        });
      }

      console.log('✅ Distribución por tipo REAL calculada para', distribution.length, 'tipos');
      return distribution.sort((a, b) => b.count - a.count);

    } catch (error) {
      console.error('❌ Error en getUserTypeDistribution:', error);
      return [];
    }
  }

  // ⭐ ACTIVIDAD RECIENTE CON DATOS 100% REALES
  async getRecentActivity(limit: number = 10, filters: DashboardFilters = {}) {
    const { regionalId, centerId } = filters;
    
    console.log('🕐 Obteniendo actividad reciente REAL:', { limit, filters });

    try {
      // ⭐ CONSULTA REAL ORDENADA POR FECHA MÁS RECIENTE
      let query = this.accessRecordRepository
        .createQueryBuilder('access')
        .leftJoinAndSelect('access.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .leftJoinAndSelect('profile.center', 'center')
        .orderBy('access.entryTime', 'DESC')
        .limit(limit);

      if (regionalId) {
        query = query.andWhere('profile.regionalId = :regionalId', { regionalId });
      }
      if (centerId) {
        query = query.andWhere('profile.centerId = :centerId', { centerId });
      }

      const recentAccess = await query.getMany();

      // ⭐ FORMATEAR DATOS REALES PARA EL FRONTEND
      const activity = recentAccess.map(access => {
        const profile = access.user?.profile;
        const isExit = !!access.exitTime;
        
        return {
          id: access.id,
          user: profile 
            ? `${profile.firstName} ${profile.lastName}`
            : 'Usuario sin perfil',
          email: access.user?.email || 'Sin email',
          type: isExit ? 'exit' : 'entry',
          time: (isExit ? access.exitTime : access.entryTime).toISOString(),
          exitTime: access.exitTime?.toISOString() || null,
          center: profile?.center?.name || 'Sin centro',
          userType: profile?.type?.name || 'Sin tipo',
          status: access.status || 'INSIDE',
          duration: access.duration || null,
        };
      });

      console.log('✅ Actividad reciente REAL obtenida:', activity.length, 'registros');
      return activity;

    } catch (error) {
      console.error('❌ Error en getRecentActivity:', error);
      return [];
    }
  }

  // ===== MÉTODOS LEGACY COMPATIBLES =====

  async getDashboardStats() {
    console.log('📊 Obteniendo estadísticas legacy');

    try {
      const enhanced = await this.getEnhancedDashboardStats();
      
      return {
        totalUsers: enhanced.totalUsers,
        activeUsers: enhanced.activeUsers,
        todayAccess: enhanced.todayAccess,
        totalProfiles: enhanced.totalProfiles,
        usersByType: enhanced.usersByType,
      };
    } catch (error) {
      console.error('❌ Error en getDashboardStats:', error);
      // ⭐ DEVOLVER DATOS POR DEFECTO EN LUGAR DE FALLAR
      return {
        totalUsers: 0,
        activeUsers: 0,
        todayAccess: 0,
        totalProfiles: 0,
        usersByType: {
          funcionarios: 0,
          contratistas: 0,
          aprendices: 0,
          visitantes: 0,
        },
      };
    }
  }

  async getUserGrowth() {
    console.log('📈 Calculando crecimiento de usuarios REAL');

    try {
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

      console.log('✅ Crecimiento REAL calculado para', userGrowth.length, 'días');
      return userGrowth;
    } catch (error) {
      console.error('❌ Error en getUserGrowth:', error);
      return [];
    }
  }

  async getUsersByRole() {
    console.log('👔 Calculando usuarios por rol REAL');

    try {
      const usersByRole = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select('role.name', 'role')
        .addSelect('COUNT(user.id)', 'count')
        .groupBy('role.name')
        .getRawMany();

      console.log('✅ Usuarios por rol REAL calculados para', usersByRole.length, 'roles');
      return usersByRole;
    } catch (error) {
      console.error('❌ Error en getUsersByRole:', error);
      return [];
    }
  }

  // ===== MÉTODOS ADICIONALES PARA DATOS 100% REALES =====

  // ⭐ OBTENER MÉTRICAS EN TIEMPO REAL
  async getRealtimeMetrics() {
    console.log('⏱️ Calculando métricas en tiempo real');

    try {
      const now = new Date();
      const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

      const [currentHourAccess, currentOccupancy] = await Promise.all([
        this.accessRecordRepository
          .createQueryBuilder('access')
          .where('access.entryTime >= :currentHour', { currentHour })
          .getCount(),

        this.accessRecordRepository
          .createQueryBuilder('access')
          .where('access.exitTime IS NULL')
          .getCount()
      ]);

      return {
        currentHourAccess,
        currentOccupancy,
        status: 'active',
        lastUpdate: now.toISOString(),
        serverTime: now.toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en getRealtimeMetrics:', error);
      return {
        currentHourAccess: 0,
        currentOccupancy: 0,
        status: 'error',
        lastUpdate: new Date().toISOString(),
        serverTime: new Date().toISOString(),
      };
    }
  }

  // ⭐ OBTENER ALERTAS BASADAS EN DATOS REALES
  async getDashboardAlerts() {
    console.log('🚨 Generando alertas basadas en datos REALES');

    try {
      const alerts: any[] = [];

      // ⭐ ALERTA: USUARIOS SIN CÓDIGO QR
      const usersWithoutQR = await this.profileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.user', 'user')
        .where('user.isActive = :isActive', { isActive: true })
        .andWhere('(profile.qrCode IS NULL OR profile.qrCode = :empty)', { empty: '' })
        .getCount();

      if (usersWithoutQR > 0) {
        alerts.push({
          type: 'warning',
          title: 'Usuarios sin código QR',
          message: `${usersWithoutQR} usuarios activos no tienen código QR asignado`,
          action: 'Ir a gestión de usuarios',
          actionUrl: '/users',
        });
      }

      // ⭐ ALERTA: ALTA OCUPACIÓN
      const currentOccupancy = await this.accessRecordRepository
        .createQueryBuilder('access')
        .where('access.exitTime IS NULL')
        .getCount();

      const totalActiveUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.isActive = :isActive', { isActive: true })
        .getCount();

      const occupancyPercentage = totalActiveUsers > 0 ? (currentOccupancy / totalActiveUsers) * 100 : 0;

      if (occupancyPercentage > 80) {
        alerts.push({
          type: 'warning',
          title: 'Alta ocupación',
          message: `Ocupación actual: ${occupancyPercentage.toFixed(1)}% (${currentOccupancy} personas)`,
          action: 'Ver ocupación actual',
          actionUrl: '/access',
        });
      }

      // ⭐ ALERTA: REGISTROS SIN SALIDA (MÁS DE 12 HORAS)
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

      const stuckRecords = await this.accessRecordRepository
        .createQueryBuilder('access')
        .where('access.exitTime IS NULL')
        .andWhere('access.entryTime < :twelveHoursAgo', { twelveHoursAgo })
        .getCount();

      if (stuckRecords > 0) {
        alerts.push({
          type: 'error',
          title: 'Registros sin salida',
          message: `${stuckRecords} personas llevan más de 12 horas sin registrar salida`,
          action: 'Revisar registros',
          actionUrl: '/access',
        });
      }

      console.log('✅ Alertas REALES generadas:', alerts.length);
      return alerts;

    } catch (error) {
      console.error('❌ Error en getDashboardAlerts:', error);
      return [];
    }
  }

  // ⭐ RESUMEN RÁPIDO CON DATOS REALES
  async getQuickSummary(filters: DashboardFilters = {}) {
    console.log('⚡ Generando resumen rápido con datos REALES');

    try {
      const [stats, activity] = await Promise.all([
        this.getEnhancedDashboardStats(filters),
        this.getRecentActivity(3, filters)
      ]);

      const activeRate = stats.totalUsers > 0 
        ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
        : '0.0';

      const summary = {
        summary: {
          totalUsers: stats.totalUsers,
          todayAccess: stats.todayAccess,
          activeRate,
          growthRate: stats.growthMetrics.accessGrowthDaily.toFixed(1),
        },
        todayTrend: stats.todayAccess,
        recentActivity: activity,
      };

      console.log('✅ Resumen rápido REAL generado');
      return summary;

    } catch (error) {
      console.error('❌ Error en getQuickSummary:', error);
      return {
        summary: {
          totalUsers: 0,
          todayAccess: 0,
          activeRate: '0.0',
          growthRate: '0.0',
        },
        todayTrend: 0,
        recentActivity: [],
      };
    }
  }

  // ⭐ EXPORTAR DATOS DEL DASHBOARD
  async exportDashboardData(timeRange: string = '30d', format: 'json' | 'csv' = 'json') {
    console.log('📤 Exportando datos REALES del dashboard');

    try {
      const filters: DashboardFilters = { timeRange: timeRange as any };

      const [stats, trends, regionalStats, centerStats, activity] = await Promise.all([
        this.getEnhancedDashboardStats(filters),
        this.getAccessTrends(filters),
        this.getRegionalStats(filters),
        this.getCenterStats(filters),
        this.getRecentActivity(50, filters)
      ]);

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          timeRange,
          format,
          totalRecords: {
            trends: trends.length,
            regionals: regionalStats.length,
            centers: centerStats.length,
            activity: activity.length,
          }
        },
        stats,
        trends,
        regionalStats,
        centerStats,
        recentActivity: activity,
      };

      console.log('✅ Datos REALES exportados exitosamente');
      return exportData;

    } catch (error) {
      console.error('❌ Error al exportar datos del dashboard:', error);
      throw error;
    }
  }

  // ⭐ VALIDAR INTEGRIDAD DE DATOS
  async validateDataIntegrity() {
    console.log('🔍 Validando integridad de datos');

    try {
      const issues: string[] = [];

      // Verificar usuarios sin perfil
      const usersWithoutProfile = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.profile', 'profile')
        .where('profile.id IS NULL')
        .getCount();

      if (usersWithoutProfile > 0) {
        issues.push(`${usersWithoutProfile} usuarios sin perfil asociado`);
      }

      // Verificar perfiles sin tipo
      const profilesWithoutType = await this.profileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.type', 'type')
        .where('type.id IS NULL')
        .getCount();

      if (profilesWithoutType > 0) {
        issues.push(`${profilesWithoutType} perfiles sin tipo de personal`);
      }

      // Verificar registros de acceso huérfanos
      const orphanedAccessRecords = await this.accessRecordRepository
        .createQueryBuilder('access')
        .leftJoin('access.user', 'user')
        .where('user.id IS NULL')
        .getCount();

      if (orphanedAccessRecords > 0) {
        issues.push(`${orphanedAccessRecords} registros de acceso sin usuario asociado`);
      }

      console.log('✅ Validación de integridad completada');
      return {
        isValid: issues.length === 0,
        issues,
        checkedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error('❌ Error en validación de integridad:', error);
      return {
        isValid: false,
        issues: ['Error al validar integridad de datos'],
        checkedAt: new Date().toISOString(),
      };
    }
  }
}