// backend/src/access/access.service.ts - COMPLETO CORREGIDO
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AccessRecord } from './entities/access-record.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AccessRecord)
    private readonly accessRecordRepository: Repository<AccessRecord>,
    
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly attendanceService: AttendanceService,
  ) {}

  // ⭐ CHECK-IN - ENTRADA AL SISTEMA
  // backend/src/access/access.service.ts - MÉTODO checkIn COMPLETO

// ⭐ CHECK-IN - ENTRADA AL SISTEMA (COMPLETO)
async checkIn(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
  let profile: Profile | null = null;

  

  try {
    // ⭐ PASO 1: BUSCAR PERFIL POR ID O QR
    if (data.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user', 'type', 'ficha', 'regional', 'center']
      });
    } else if (data.qrData) {
      try {
        const qrInfo = JSON.parse(data.qrData);
        
        if (qrInfo.doc) {
          profile = await this.profileRepository.findOne({
            where: { documentNumber: qrInfo.doc },
            relations: ['user', 'type', 'ficha', 'regional', 'center']
          });
        }
      } catch (qrError) {
        console.error('❌ Error al parsear QR:', qrError);
        throw new BadRequestException('Código QR inválido');
      }
    }

    if (!profile) {
      console.error('❌ Perfil no encontrado');
      throw new NotFoundException('Perfil no encontrado');
    }

    if (!profile.user || !profile.user.isActive) {
      console.error('❌ Usuario inactivo:', profile.user?.id);
      throw new BadRequestException('Usuario inactivo');
    }


    // ⭐ PASO 2: VERIFICAR SI YA ESTÁ DENTRO (SIN CHECK-OUT)
    const existingEntry = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (existingEntry) {
      throw new BadRequestException('El usuario ya se encuentra dentro de las instalaciones');
    }

    // ⭐ PASO 3: CREAR NUEVO REGISTRO DE ACCESO
    const newRecord = this.accessRecordRepository.create({
      userId: profile.user.id,
      entryTime: new Date(),
      status: 'INSIDE',
      notes: `Check-in realizado - ${profile.type.name}`
    });

    const accessRecord = await this.accessRecordRepository.save(newRecord);
    

    // ⭐ PASO 4: MARCAR ASISTENCIA AUTOMÁTICAMENTE PARA APRENDICES
    if (profile.type.name === 'Aprendiz' && profile.ficha) {
  ;

  try {
    const attendanceResults = await this.attendanceService.autoMarkAttendance(
      profile.id, 
      accessRecord.entryTime,
      accessRecord.id
    );


  } catch (error: any) {
    console.error('❌ ERROR CRÍTICO en marcado automático:', {
      message: error?.message || 'Error desconocido',
      type: error?.constructor?.name || 'Unknown',
      // Solo incluir stack si está disponible y no es muy largo
      ...(error?.stack && { 
        stackPreview: error.stack.split('\n').slice(0, 3).join('\n') 
      })
    });
    
    // ⭐ NO lanzar el error para no afectar el check-in
  }

} else {
  if (profile.type.name !== 'Aprendiz') {
  } else {
  }
}

    // ⭐ PASO 5: RETORNAR ESTRUCTURA CORRECTA PARA FRONTEND
    const response = {
      id: accessRecord.id,
      entryTime: accessRecord.entryTime.toISOString(),
      status: accessRecord.status,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          documentNumber: profile.documentNumber,
          documentType: profile.documentType,
          profileImage: profile.profileImage,
          type: profile.type.name,
          center: profile.center?.name || null
        }
      }
    } as any;

    

    return response;

  } catch (error) {
    console.error('❌ ERROR EN EL PROCESO DE CHECK-IN:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    throw error;
  }
}

// ⭐ CHECK-OUT - SALIDA DEL SISTEMA (CORREGIDO)
async checkOut(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
  let profile: Profile | null = null;

 

  try {
    // ⭐ BUSCAR PERFIL POR ID O QR
    if (data.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user', 'type', 'center']
      });
    } else if (data.qrData) {
      try {
        const qrInfo = JSON.parse(data.qrData);
        
        if (qrInfo.doc) {
          profile = await this.profileRepository.findOne({
            where: { documentNumber: qrInfo.doc },
            relations: ['user', 'type', 'center']
          });
        }
      } catch (qrError) {
        console.error('❌ Error al parsear QR:', qrError);
        throw new BadRequestException('Código QR inválido');
      }
    }

    if (!profile) {
      console.error('❌ Perfil no encontrado');
      throw new NotFoundException('Perfil no encontrado');
    }

    if (!profile.user || !profile.user.isActive) {
      console.error('❌ Usuario inactivo:', profile.user?.id);
      throw new BadRequestException('Usuario inactivo');
    }

   

    // ⭐ BUSCAR ENTRADA ACTIVA (SIN SALIDA)
    const activeEntry = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (!activeEntry) {
      throw new BadRequestException('No se encontró una entrada activa para este usuario');
    }

    // ⭐ ACTUALIZAR REGISTRO CON HORA DE SALIDA Y DURACIÓN
    const exitTime = new Date();
    activeEntry.exitTime = exitTime;
    activeEntry.status = 'OUTSIDE';
    activeEntry.duration = this.calculateDuration(activeEntry.entryTime, exitTime);
    activeEntry.notes = (activeEntry.notes || '') + ` | Check-out realizado`;

    const updatedRecord = await this.accessRecordRepository.save(activeEntry);
   

    // ⭐ RETORNAR ESTRUCTURA CORRECTA PARA FRONTEND
    return {
      id: updatedRecord.id,
      entryTime: updatedRecord.entryTime.toISOString(),
      exitTime: updatedRecord.exitTime.toISOString(),
      status: updatedRecord.status,
      duration: updatedRecord.duration,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          documentNumber: profile.documentNumber,
          documentType: profile.documentType,
          profileImage: profile.profileImage,
          type: profile.type.name,
          center: profile.center?.name || null
        }
      }
    } as any;

  } catch (error) {
    console.error('❌ Error en check-out:', error);
    throw error;
  }
}

  // ⭐ OBTENER ESTADÍSTICAS DE ACCESO
  async getStats(filters: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    try {

      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

      const queryBuilder = this.accessRecordRepository.createQueryBuilder('access')
        .leftJoinAndSelect('access.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .where('access.entryTime BETWEEN :startDate AND :endDate', { startDate, endDate });

      const records = await queryBuilder.getMany();

      // ⭐ CALCULAR ESTADÍSTICAS COMPLETAS
      const totalEntries = records.length;
      const totalAccess = totalEntries;
      const uniqueUsers = new Set(records.map(r => r.user?.id)).size;
      
      const entriesByType = records.reduce((acc, record) => {
        const userType = record.user?.profile?.type?.name || 'Desconocido';
        acc[userType] = (acc[userType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const entriesByDay = records.reduce((acc, record) => {
        const day = record.entryTime.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // ⭐ AGREGAR ESTADÍSTICAS POR HORA
      const accessByHour = records.reduce((acc, record) => {
        const hour = record.entryTime.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Calcular promedio de tiempo dentro
      const completedSessions = records.filter(r => r.exitTime);
      const averageSessionTime = completedSessions.length > 0 
        ? completedSessions.reduce((acc, record) => {
            const duration = record.exitTime!.getTime() - record.entryTime.getTime();
            return acc + duration;
          }, 0) / completedSessions.length
        : 0;

      const averageHours = Math.floor(averageSessionTime / (1000 * 60 * 60));
      const averageMinutes = Math.floor((averageSessionTime % (1000 * 60 * 60)) / (1000 * 60));
      const averageDurationMinutes = Math.floor(averageSessionTime / (1000 * 60));


      return {
        period: { startDate, endDate },
        totalEntries,
        totalAccess,
        uniqueUsers,
        currentlyInside: await this.getCurrentOccupancy().then(r => r.total),
        averageDaily: totalEntries / Math.max(1, Object.keys(entriesByDay).length),
        averageSessionTime: `${averageHours}h ${averageMinutes}m`,
        averageDurationMinutes,
        entriesByType,
        entriesByDay,
        accessByHour,
        peakDay: Object.entries(entriesByDay).reduce((max, [day, count]) => 
          count > max.count ? { day, count } : max, { day: '', count: 0 }
        ),
        peakHour: Object.entries(accessByHour).reduce((max, [hour, count]) => 
          count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 }
        ),
        completedSessions: completedSessions.length,
        activeSessions: records.length - completedSessions.length
      };

    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HISTORIAL DE ACCESOS
  async getHistory(filters: {
    userId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.accessRecordRepository.createQueryBuilder('access')
        .leftJoinAndSelect('access.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .orderBy('access.entryTime', 'DESC');

      // ⭐ APLICAR FILTROS
      if (filters.userId) {
        queryBuilder.andWhere('access.userId = :userId', { userId: filters.userId });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('access.entryTime >= :startDate', { 
          startDate: new Date(filters.startDate) 
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('access.entryTime <= :endDate', { 
          endDate: new Date(filters.endDate) 
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('access.status = :status', { 
          status: filters.status 
        });
      }

      // ⭐ OBTENER TOTAL Y REGISTROS
      const [records, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();


      return {
        data: records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };

    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw error;
    }
  }

  // ⭐ BUSCAR POR NÚMERO DE DOCUMENTO
  async searchByDocument(documentNumber: string) {
    try {

      // Buscar el perfil por documento
      const profile = await this.profileRepository.findOne({
        where: { documentNumber },
        relations: ['user', 'type']
      });

      if (!profile) {
        return {
          found: false,
          message: 'No se encontró un usuario con ese número de documento',
          documentNumber
        };
      }

      // Obtener historial de accesos del usuario
      const accessRecords = await this.accessRecordRepository.find({
        where: { userId: profile.user.id },
        relations: ['user', 'user.profile', 'user.profile.type'],
        order: { entryTime: 'DESC' },
        take: 50
      });

      // Verificar estado actual
      const currentStatus = await this.checkUserStatus(profile.user.id);

     

      return {
        found: true,
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          documentNumber: profile.documentNumber,
          type: profile.type.name,
          user: {
            id: profile.user.id,
            email: profile.user.email,
            isActive: profile.user.isActive
          }
        },
        user: {
          id: profile.user.id,
          profile: {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            documentNumber: profile.documentNumber,
            type: profile.type.name
          }
        },
        currentStatus,
        accessHistory: accessRecords.map(record => ({
          id: record.id,
          entryTime: record.entryTime,
          exitTime: record.exitTime,
          status: record.status,
          duration: record.duration,
          notes: record.notes
        })),
        totalRecords: accessRecords.length
      };

    } catch (error) {
      console.error('❌ Error al buscar por documento:', error);
      return {
        found: false,
        message: 'Error interno del servidor',
        error: error.message,
        documentNumber
      };
    }
  }

  // ⭐ OBTENER ACCESOS ACTIVOS
  async getActiveAccess() {
    try {
      

      const activeRecords = await this.accessRecordRepository.find({
        where: {
          exitTime: IsNull()
        },
        relations: ['user', 'user.profile', 'user.profile.type'],
        order: { entryTime: 'DESC' }
      });

      

      return {
        total: activeRecords.length,
        records: activeRecords.map(record => ({
          id: record.id,
          user: {
            id: record.user?.id || 0,
            profile: {
              id: record.user?.profile?.id || 0,
              firstName: record.user?.profile?.firstName || 'Sin nombre',
              lastName: record.user?.profile?.lastName || '',
              documentNumber: record.user?.profile?.documentNumber || 'Sin documento',
              type: record.user?.profile?.type?.name || 'Desconocido'
            }
          },
          entryTime: record.entryTime,
          status: record.status,
          duration: this.calculateDurationFromEntry(record.entryTime),
          notes: record.notes || ''
        }))
      };

    } catch (error) {
      console.error('❌ Error al obtener accesos activos:', error);
      throw error;
    }
  }

  // ⭐ OBTENER OCUPACIÓN ACTUAL
  async getCurrentOccupancy() {
  try {

    const currentOccupancy = await this.accessRecordRepository.find({
      where: {
        exitTime: IsNull()
      },
      relations: ['user', 'user.profile', 'user.profile.type'],
      order: { entryTime: 'DESC' }
    });


    // ⭐ LOGGING DETALLADO PARA DEBUGGING
   

    // ⭐ AGRUPAR POR TIPO DE USUARIO CON CONTADORES
    const occupancyByType = currentOccupancy.reduce((acc, record) => {
      const userType = record.user?.profile?.type?.name || 'Desconocido';
      acc[userType] = (acc[userType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalOccupancy = currentOccupancy.length;

    // ⭐ ESTRUCTURA CORREGIDA PARA EL FRONTEND
    const response = {
      total: totalOccupancy,
      byType: occupancyByType,
      // ⭐ CAMBIAR 'details' POR 'records' Y CORREGIR ESTRUCTURA
      records: currentOccupancy.map(record => ({
        id: record.id,
        entryTime: record.entryTime.toISOString(),
        user: {
          id: record.user?.id || 0,
          email: record.user?.email || '',
          profile: {
            id: record.user?.profile?.id || 0,
            // ⭐ SEPARAR firstName Y lastName (no concatenar)
            firstName: record.user?.profile?.firstName || 'Sin nombre',
            lastName: record.user?.profile?.lastName || '',
            documentNumber: record.user?.profile?.documentNumber || 'Sin documento',
            profileImage: record.user?.profile?.profileImage || null,
            // ⭐ CORREGIR ESTRUCTURA DEL TIPO
            type: {
              name: record.user?.profile?.type?.name || 'Desconocido'
            }
          }
        }
      }))
    };


    return response;

  } catch (error) {
    console.error('❌ Error al obtener ocupación actual:', error);
    throw error;
  }
}

  // ⭐ VERIFICAR ESTADO DE ACCESO DE UN USUARIO
  async checkUserStatus(userId: number) {
    try {

      const activeEntry = await this.accessRecordRepository.findOne({
        where: {
          userId: userId,
          exitTime: IsNull()
        },
        relations: ['user', 'user.profile', 'user.profile.type'],
        order: { entryTime: 'DESC' }
      });

      const isInside = !!activeEntry;
      const lastEntry = activeEntry || await this.accessRecordRepository.findOne({
        where: { userId: userId },
        relations: ['user', 'user.profile', 'user.profile.type'],
        order: { entryTime: 'DESC' }
      });


      return {
        userId,
        isInside,
        currentEntry: activeEntry ? {
          id: activeEntry.id,
          entryTime: activeEntry.entryTime,
          status: activeEntry.status,
          duration: this.calculateDurationFromEntry(activeEntry.entryTime)
        } : null,
        lastAccess: lastEntry ? {
          id: lastEntry.id,
          entryTime: lastEntry.entryTime,
          exitTime: lastEntry.exitTime,
          status: lastEntry.status,
          duration: lastEntry.duration
        } : null
      };

    } catch (error) {
      console.error('❌ Error al verificar estado:', error);
      throw error;
    }
  }

  // ⭐ FORZAR CHECK-OUT (PARA ADMINISTRADORES)
  async forceCheckOut(data: { 
    userId?: number; 
    accessRecordId?: number; 
    reason?: string;
    adminUserId: number;
  }) {
    try {

      let activeEntry: AccessRecord | null = null;

      // Buscar por ID de registro de acceso o por usuario
      if (data.accessRecordId) {
        activeEntry = await this.accessRecordRepository.findOne({
          where: { 
            id: data.accessRecordId,
            exitTime: IsNull()
          },
          relations: ['user', 'user.profile']
        });
      } else if (data.userId) {
        activeEntry = await this.accessRecordRepository.findOne({
          where: { 
            userId: data.userId,
            exitTime: IsNull()
          },
          relations: ['user', 'user.profile'],
          order: { entryTime: 'DESC' }
        });
      }

      if (!activeEntry) {
        throw new NotFoundException('No se encontró una entrada activa para forzar el check-out');
      }

      // Actualizar registro con check-out forzado
      const exitTime = new Date();
      activeEntry.exitTime = exitTime;
      activeEntry.status = 'FORCED_OUT';
      activeEntry.duration = this.calculateDuration(activeEntry.entryTime, exitTime);
      activeEntry.notes = (activeEntry.notes || '') + 
        ` | Check-out forzado por admin (ID: ${data.adminUserId})` +
        (data.reason ? ` - Razón: ${data.reason}` : '');

      const updatedRecord = await this.accessRecordRepository.save(activeEntry);


      return {
        message: 'Check-out forzado exitosamente',
        record: {
          id: updatedRecord.id,
          userId: updatedRecord.userId,
          userName: activeEntry.user?.profile 
            ? `${activeEntry.user.profile.firstName} ${activeEntry.user.profile.lastName}`
            : 'Sin nombre',
          entryTime: updatedRecord.entryTime,
          exitTime: updatedRecord.exitTime,
          duration: updatedRecord.duration || '',
          status: updatedRecord.status,
          reason: data.reason || 'Sin razón especificada'
        }
      };

    } catch (error) {
      console.error('❌ Error al forzar check-out:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DETALLADO DE ACCESOS
  async getDetailedReport(filters: {
    startDate?: string;
    endDate?: string;
    userType?: string;
    includeActive?: boolean;
  }) {
    try {

      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

      const queryBuilder = this.accessRecordRepository.createQueryBuilder('access')
        .leftJoinAndSelect('access.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('profile.type', 'type')
        .where('access.entryTime BETWEEN :startDate AND :endDate', { startDate, endDate });

      if (filters.userType) {
        queryBuilder.andWhere('type.name = :userType', { userType: filters.userType });
      }

      if (!filters.includeActive) {
        queryBuilder.andWhere('access.exitTime IS NOT NULL');
      }

      const records = await queryBuilder
        .orderBy('access.entryTime', 'DESC')
        .getMany();

      // Agrupar por usuario
      const userSummary = records.reduce((acc, record) => {
        const userId = record.user?.id;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            user: {
              id: userId,
              name: record.user?.profile 
                ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                : 'Sin nombre',
              documentNumber: record.user?.profile?.documentNumber || 'Sin documento',
              type: record.user?.profile?.type?.name || 'Desconocido'
            },
            totalVisits: 0,
            totalTime: 0,
            averageTime: 0,
            lastVisit: null as Date | null,
            visits: []
          };
        }

        acc[userId].totalVisits++;
        acc[userId].lastVisit = record.entryTime;

        if (record.exitTime) {
          const sessionTime = record.exitTime.getTime() - record.entryTime.getTime();
          acc[userId].totalTime += sessionTime;
        }

        acc[userId].visits.push({
          id: record.id,
          entryTime: record.entryTime,
          exitTime: record.exitTime,
          duration: record.duration,
          status: record.status
        });

        return acc;
      }, {} as Record<number, any>);

      // Calcular promedios
      Object.values(userSummary).forEach((summary: any) => {
        if (summary.totalVisits > 0) {
          summary.averageTime = summary.totalTime / summary.totalVisits;
          const avgHours = Math.floor(summary.averageTime / (1000 * 60 * 60));
          const avgMinutes = Math.floor((summary.averageTime % (1000 * 60 * 60)) / (1000 * 60));
          summary.averageTimeFormatted = `${avgHours}h ${avgMinutes}m`;
        }
      });


      return {
        period: { startDate, endDate },
        totalRecords: records.length,
        uniqueUsers: Object.keys(userSummary).length,
        userSummary: Object.values(userSummary),
        filters
      };

    } catch (error) {
      console.error('❌ Error al generar reporte detallado:', error);
      throw error;
    }
  }

  // ⭐ LIMPIAR REGISTROS ANTIGUOS (MANTENIMIENTO)
  async cleanupOldRecords(daysToKeep: number = 365) {
    try {

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.accessRecordRepository
        .createQueryBuilder()
        .delete()
        .where('entryTime < :cutoffDate', { cutoffDate })
        .execute();


      return {
        message: `Se eliminaron ${result.affected} registros antiguos`,
        cutoffDate,
        recordsDeleted: result.affected
      };

    } catch (error) {
      console.error('❌ Error en limpieza:', error);
      throw error;
    }
  }

  // ⭐ MÉTODOS AUXILIARES - CALCULAR DURACIÓN
  private calculateDuration(entryTime: Date, exitTime: Date): string {
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  }

  private calculateDurationFromEntry(entryTime: Date): string {
    const now = new Date();
    return this.calculateDuration(entryTime, now);
  }
async validateQR(qrData: string): Promise<{
  valid: boolean;
  profile?: any;
  message: string;
}> {
  try {
    
    // Intentar parsear el QR
    let qrInfo;
    try {
      qrInfo = JSON.parse(qrData);
    } catch (parseError) {
      return {
        valid: false,
        message: 'Formato de código QR inválido'
      };
    }
    
    // Validar estructura del QR ACCESUM
    if (!qrInfo.type || !qrInfo.type.includes('ACCESUM')) {
      return {
        valid: false,
        message: 'El código QR no es de tipo ACCESUM_SENA'
      };
    }
    
    if (!qrInfo.doc) {
      return {
        valid: false,
        message: 'El código QR no contiene número de documento'
      };
    }
    
    // Buscar el perfil por documento
    const profile = await this.profileRepository.findOne({
      where: { documentNumber: qrInfo.doc },
      relations: ['user', 'type', 'ficha', 'regional', 'center']
    });
    
    if (!profile) {
      return {
        valid: false,
        message: `No se encontró un perfil con documento ${qrInfo.doc}`
      };
    }
    
    if (!profile.user || !profile.user.isActive) {
      return {
        valid: false,
        message: 'El usuario asociado al perfil está inactivo'
      };
    }
    
    
    return {
      valid: true,
      message: 'Código QR válido',
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        documentNumber: profile.documentNumber,
        documentType: profile.documentType,
        profileImage: profile.profileImage,
        type: profile.type.name,
        ficha: profile.ficha ? {
          id: profile.ficha.id,
          code: profile.ficha.code,
          name: profile.ficha.name
        } : null,
        center: profile.center?.name || null,
        user: {
          id: profile.user.id,
          email: profile.user.email,
          isActive: profile.user.isActive
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error al validar QR:', error);
    return {
      valid: false,
      message: 'Error interno al validar el código QR'
    };
  }
}
}
