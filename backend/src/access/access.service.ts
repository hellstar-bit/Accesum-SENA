// backend/src/access/access.service.ts - VERSIÃ“N MEJORADA
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { AccessRecord } from './entities/access-record.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AccessRecord)
    private accessRecordRepository: Repository<AccessRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private attendanceService: AttendanceService,
  ) {}

  // â­ CHECK-IN MEJORADO CON MEJOR LOGGING
  async checkIn(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    let profile: Profile | null = null;

    console.log('ðŸšª Iniciando proceso de CHECK-IN:', { profileId: data.profileId, hasQrData: !!data.qrData });

    // Buscar perfil por ID o por datos del QR
    if (data.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user', 'type', 'ficha']
      });
      console.log('ðŸ” BÃºsqueda por profileId:', profile ? 'Encontrado' : 'No encontrado');
    } else if (data.qrData) {
      try {
        const qrInfo = JSON.parse(data.qrData);
        console.log('ðŸ“± Datos del QR parseados:', { doc: qrInfo.doc, type: qrInfo.type });
        
        profile = await this.profileRepository.findOne({
          where: { documentNumber: qrInfo.doc },
          relations: ['user', 'type', 'ficha']
        });
        console.log('ðŸ” BÃºsqueda por documento QR:', profile ? 'Encontrado' : 'No encontrado');
      } catch (error) {
        console.error('âŒ Error al parsear QR:', error);
        throw new BadRequestException('Datos QR invÃ¡lidos');
      }
    } else {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    if (!profile) {
      console.log('âŒ Perfil no encontrado');
      throw new NotFoundException('Perfil no encontrado');
    }

    if (!profile.user) {
      console.log('âŒ Usuario no encontrado para el perfil');
      throw new NotFoundException('Usuario no encontrado para este perfil');
    }

    console.log('ðŸ‘¤ Perfil encontrado:', {
      id: profile.id,
      nombre: `${profile.firstName} ${profile.lastName}`,
      documento: profile.documentNumber,
      tipo: profile.type.name,
      ficha: profile.ficha?.code || 'Sin ficha'
    });

    // Verificar si ya tiene un acceso activo
    const activeAccess = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (activeAccess) {
      console.log('âš ï¸ Usuario ya tiene un acceso activo desde:', activeAccess.entryTime);
      throw new BadRequestException('El usuario ya tiene un acceso activo');
    }

    // Crear nuevo registro de acceso
    const newRecord = this.accessRecordRepository.create({
      userId: profile.user.id,
      entryTime: new Date(),
      status: 'ENTRADA'
    });

    const accessRecord = await this.accessRecordRepository.save(newRecord);
    console.log('âœ… Registro de acceso creado:', {
      id: accessRecord.id,
      userId: profile.user.id,
      entryTime: accessRecord.entryTime
    });

    // â­ MARCAR ASISTENCIA AUTOMÃTICAMENTE PARA APRENDICES
    if (profile.type.name === 'Aprendiz' && profile.ficha) {
      console.log('ðŸŽ“ Iniciando marcado automÃ¡tico de asistencia...');
      console.log('ðŸ“š Datos del aprendiz:', {
        profileId: profile.id,
        ficha: profile.ficha.code,
        fichaId: profile.ficha.id
      });

      try {
        const attendanceResults = await this.attendanceService.autoMarkAttendance(
          profile.id, 
          accessRecord.entryTime
        );

        if (attendanceResults && attendanceResults.length > 0) {
          console.log('âœ… Asistencia marcada automÃ¡ticamente:', {
            registros: attendanceResults.length,
            clases: attendanceResults.map(r => ({ scheduleId: r.scheduleId, status: r.status }))
          });
        } else {
          console.log('â„¹ï¸ No se encontraron clases activas para marcar asistencia');
        }
      } catch (error) {
        console.error('âŒ Error al marcar asistencia automÃ¡tica:', {
          message: error.message,
          stack: error.stack
        });
        // No lanzar el error, solo loggear para no afectar el check-in
      }
    } else {
      console.log('â„¹ï¸ No es aprendiz o no tiene ficha asignada, no se marca asistencia automÃ¡tica');
    }

    // Retornar con relaciones completas
    const result = await this.accessRecordRepository.findOne({
      where: { id: accessRecord.id },
      relations: ['user', 'user.profile', 'user.profile.type', 'user.profile.ficha']
    });

    if (!result) {
      throw new NotFoundException('Error al recuperar el registro de acceso');
    }

    console.log('ðŸŽ‰ CHECK-IN completado exitosamente para:', `${profile.firstName} ${profile.lastName}`);
    return result;
  }

  // â­ CHECK-OUT MEJORADO
  async checkOut(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    let profile: Profile | null = null;

    console.log('ðŸšª Iniciando proceso de CHECK-OUT:', { profileId: data.profileId, hasQrData: !!data.qrData });

    if (data.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user']
      });
    } else if (data.qrData) {
      try {
        const qrInfo = JSON.parse(data.qrData);
        profile = await this.profileRepository.findOne({
          where: { documentNumber: qrInfo.doc },
          relations: ['user']
        });
      } catch (error) {
        throw new BadRequestException('Datos QR invÃ¡lidos');
      }
    } else {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    if (!profile || !profile.user) {
      throw new NotFoundException('Perfil o usuario no encontrado');
    }

    console.log('ðŸ‘¤ Perfil para CHECK-OUT:', `${profile.firstName} ${profile.lastName}`);

    // Buscar acceso activo
    const activeAccess = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (!activeAccess) {
      console.log('âŒ No se encontrÃ³ acceso activo');
      throw new BadRequestException('No se encontrÃ³ un acceso activo para este usuario');
    }

    // Actualizar con hora de salida
    activeAccess.exitTime = new Date();
    activeAccess.status = 'SALIDA';

    // Calcular duraciÃ³n
    const entryTime = new Date(activeAccess.entryTime);
    const exitTime = new Date(activeAccess.exitTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    activeAccess.duration = `${hours}h ${minutes}m`;

    const updatedRecord = await this.accessRecordRepository.save(activeAccess);

    console.log('âœ… CHECK-OUT completado:', {
      usuario: `${profile.firstName} ${profile.lastName}`,
      duracion: activeAccess.duration,
      entrada: entryTime.toLocaleTimeString(),
      salida: exitTime.toLocaleTimeString()
    });

    // Retornar con relaciones completas
    const result = await this.accessRecordRepository.findOne({
      where: { id: updatedRecord.id },
      relations: ['user', 'user.profile', 'user.profile.type']
    });

    if (!result) {
      throw new NotFoundException('Error al recuperar el registro actualizado');
    }

    return result;
  }

  // â­ RESTO DE MÃ‰TODOS SIN CAMBIOS SIGNIFICATIVOS
  async getCurrentOccupancy() {
    const currentRecords = await this.accessRecordRepository.find({
      where: { exitTime: IsNull() },
      relations: ['user', 'user.profile', 'user.profile.type'],
      order: { entryTime: 'DESC' }
    });

    // Contar por tipo
    const byType: Record<string, number> = {};
    currentRecords.forEach(record => {
      const type = record.user.profile.type.name;
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: currentRecords.length,
      byType,
      records: currentRecords.map(record => ({
        id: record.id,
        entryTime: record.entryTime,
        status: record.status,
        user: {
          id: record.user.id,
          email: record.user.email,
          profile: {
            firstName: record.user.profile.firstName,
            lastName: record.user.profile.lastName,
            documentNumber: record.user.profile.documentNumber,
            profileImage: record.user.profile.profileImage,
            type: record.user.profile.type.name,
            center: record.user.profile.center?.name || 'N/A'
          }
        }
      }))
    };
  }

  async getHistory(params?: {
    page?: number;
    limit?: number;
    date?: Date;
    userId?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    let whereConditions: any = {};

    if (params?.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.entryTime = Between(startOfDay, endOfDay);
    }

    if (params?.userId) {
      whereConditions.userId = params.userId;
    }

    const [records, total] = await this.accessRecordRepository.findAndCount({
      where: whereConditions,
      relations: ['user', 'user.profile', 'user.profile.type'],
      order: { entryTime: 'DESC' },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: records.map(record => ({
        id: record.id,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        status: record.status,
        duration: record.duration,
        user: {
          id: record.user.id,
          email: record.user.email,
          profile: {
            firstName: record.user.profile.firstName,
            lastName: record.user.profile.lastName,
            documentNumber: record.user.profile.documentNumber,
            profileImage: record.user.profile.profileImage,
            type: record.user.profile.type.name,
            center: record.user.profile.center?.name || 'N/A'
          }
        }
      })),
      total,
      page,
      limit,
      totalPages
    };
  }

  async getStats(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const totalAccess = await this.accessRecordRepository.count({
      where: {
        entryTime: Between(startOfDay, endOfDay)
      }
    });

    const currentlyInside = await this.accessRecordRepository.count({
      where: { exitTime: IsNull() }
    });

    const accessByHour: Array<{ hour: number; count: number }> = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(startOfDay);
      hourStart.setHours(hour, 0, 0, 0);
      
      const hourEnd = new Date(startOfDay);
      hourEnd.setHours(hour, 59, 59, 999);

      const count = await this.accessRecordRepository.count({
        where: {
          entryTime: Between(hourStart, hourEnd)
        }
      });

      accessByHour.push({ hour, count });
    }

    // DuraciÃ³n promedio
    const completedRecords = await this.accessRecordRepository.find({
      where: {
        entryTime: Between(startOfDay, endOfDay),
        exitTime: Between(startOfDay, endOfDay)
      }
    });

    let averageDurationMinutes = 0;
    if (completedRecords.length > 0) {
      const totalMinutes = completedRecords.reduce((sum, record) => {
        if (record.exitTime) {
          const duration = new Date(record.exitTime).getTime() - new Date(record.entryTime).getTime();
          return sum + (duration / (1000 * 60));
        }
        return sum;
      }, 0);
      
      averageDurationMinutes = Math.round(totalMinutes / completedRecords.length);
    }

    return {
      totalAccess,
      currentlyInside,
      accessByHour,
      averageDurationMinutes
    };
  }

  async searchByDocument(documentNumber: string) {
    const profile = await this.profileRepository.findOne({
      where: { documentNumber },
      relations: ['type']
    });

    if (!profile) {
      return { found: false };
    }

    return {
      found: true,
      profile: {
        id: profile.id,
        fullName: `${profile.firstName} ${profile.lastName}`,
        documentNumber: profile.documentNumber,
        type: profile.type.name,
        profileImage: profile.profileImage
      }
    };
  }

  async getActiveAccess(userId: number) {
    return await this.accessRecordRepository.findOne({
      where: {
        userId,
        exitTime: IsNull()
      },
      relations: ['user', 'user.profile', 'user.profile.type'],
      order: { entryTime: 'DESC' }
    });
  }

  // â­ NUEVO: MÃ‰TODO PARA FORZAR SALIDA
  async forceCheckOut(userId: number, reason?: string) {
    const activeAccess = await this.getActiveAccess(userId);
    
    if (!activeAccess) {
      throw new BadRequestException('No hay acceso activo para este usuario');
    }

    activeAccess.exitTime = new Date();
    activeAccess.status = 'SALIDA';
    
    const entryTime = new Date(activeAccess.entryTime);
    const exitTime = new Date(activeAccess.exitTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    activeAccess.duration = `${hours}h ${minutes}m`;

    // Si hay razÃ³n, agregarla como nota (esto requerirÃ­a un campo notes en la entidad)
    if (reason) {
      console.log('ðŸ”§ Salida forzada:', { userId, reason, duration: activeAccess.duration });
    }

    return await this.accessRecordRepository.save(activeAccess);
  }
}