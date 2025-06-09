// backend/src/access/access.service.ts - CORREGIDO
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm'; // ⭐ AGREGAR IsNull
import { AccessRecord } from './entities/access-record.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class AccessService {
  forceCheckOut(userId: number, reason: string | undefined) {
    throw new Error('Method not implemented.');
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

  // Filtro por fecha
  if (params?.date) {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    whereConditions.entryTime = Between(startOfDay, endOfDay);
  }

  // Filtro por usuario
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

  // ⭐ ASEGURAR QUE SE RETORNE EL OBJETO
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
  constructor(
    @InjectRepository(AccessRecord)
    private accessRecordRepository: Repository<AccessRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private attendanceService: AttendanceService,
  ) {}

  // ⭐ CHECK-IN CORREGIDO
  async checkIn(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    let profile: Profile | null = null; // ⭐ CORREGIDO: Profile | null

    // Buscar perfil por ID o por datos del QR
    if (data.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user', 'type', 'ficha']
      });
    } else if (data.qrData) {
      try {
        const qrInfo = JSON.parse(data.qrData);
        profile = await this.profileRepository.findOne({
          where: { documentNumber: qrInfo.doc },
          relations: ['user', 'type', 'ficha']
        });
      } catch (error) {
        throw new BadRequestException('Datos QR inválidos');
      }
    } else {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    if (!profile.user) {
      throw new NotFoundException('Usuario no encontrado para este perfil');
    }

    // ⭐ CORREGIDO: Usar IsNull()
    const activeAccess = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (activeAccess) {
      throw new BadRequestException('El usuario ya tiene un acceso activo');
    }

    // Crear nuevo registro de acceso
    const newRecord = this.accessRecordRepository.create({
      userId: profile.user.id,
      entryTime: new Date(),
      status: 'ENTRADA'
    });

    const accessRecord = await this.accessRecordRepository.save(newRecord);

    // ⭐ MARCAR ASISTENCIA AUTOMÁTICAMENTE
    if (profile.type.name === 'Aprendiz' && profile.ficha) {
      try {
        console.log(`🎓 Marcando asistencia automática para aprendiz: ${profile.firstName} ${profile.lastName}`);
        await this.attendanceService.autoMarkAttendance(
          profile.id, 
          accessRecord.entryTime
        );
        console.log('✅ Asistencia marcada automáticamente');
      } catch (error) {
        console.error('❌ Error al marcar asistencia automática:', error);
      }
    }

    // Retornar con relaciones completas
    const result = await this.accessRecordRepository.findOne({
      where: { id: accessRecord.id },
      relations: ['user', 'user.profile', 'user.profile.type']
    });

    if (!result) {
      throw new NotFoundException('Error al recuperar el registro de acceso');
    }

    return result;
  }

  // ⭐ CHECK-OUT CORREGIDO
  async checkOut(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    let profile: Profile | null = null; // ⭐ CORREGIDO: Profile | null

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
        throw new BadRequestException('Datos QR inválidos');
      }
    } else {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    if (!profile || !profile.user) {
      throw new NotFoundException('Perfil o usuario no encontrado');
    }

    // ⭐ CORREGIDO: Usar IsNull()
    const activeAccess = await this.accessRecordRepository.findOne({
      where: {
        userId: profile.user.id,
        exitTime: IsNull()
      },
      order: { entryTime: 'DESC' }
    });

    if (!activeAccess) {
      throw new BadRequestException('No se encontró un acceso activo para este usuario');
    }

    // Actualizar con hora de salida
    activeAccess.exitTime = new Date();
    activeAccess.status = 'SALIDA';

    // ⭐ CALCULAR Y ASIGNAR DURACIÓN
    const entryTime = new Date(activeAccess.entryTime);
    const exitTime = new Date(activeAccess.exitTime);
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    activeAccess.duration = `${hours}h ${minutes}m`;

    const updatedRecord = await this.accessRecordRepository.save(activeAccess);

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

  // ⭐ OBTENER OCUPACIÓN ACTUAL CORREGIDO
  async getCurrentOccupancy() {
    const currentRecords = await this.accessRecordRepository.find({
      where: { exitTime: IsNull() }, // ⭐ CORREGIDO: Usar IsNull()
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

  // ⭐ OBTENER ESTADÍSTICAS CORREGIDO
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
      where: { exitTime: IsNull() } // ⭐ CORREGIDO: Usar IsNull()
    });

    // ⭐ CORREGIDO: Tipar explícitamente el array
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

    // Duración promedio
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

  // ⭐ RESTO DE MÉTODOS (sin cambios significativos)
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
        exitTime: IsNull() // ⭐ CORREGIDO: Usar IsNull()
      },
      relations: ['user', 'user.profile', 'user.profile.type'],
      order: { entryTime: 'DESC' }
    });
  }

  // ... resto de métodos sin cambios
}
