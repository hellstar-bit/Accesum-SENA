// backend/src/access/access.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { AccessRecord } from './entities/access-record.entity';
import { Profile } from '../profiles/entities/profile.entity';

export interface CreateAccessRecordDto {
  profileId?: number;
  qrData?: string;
  type: 'entry' | 'exit';
}

export interface AccessRecordResponse {
  id: number;
  entryTime: Date;
  exitTime?: Date;
  status: string;
  duration?: string;
  user: {
    id: number;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      documentNumber: string;
      profileImage?: string;
      type: string;
      center: string;
    };
  };
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AccessRecord)
    private accessRecordRepository: Repository<AccessRecord>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async createAccessRecord(dto: CreateAccessRecordDto): Promise<AccessRecordResponse> {
    let profile: Profile | null = null;

    // Buscar perfil por QR o por ID
    if (dto.qrData) {
      try {
        const qrInfo = JSON.parse(dto.qrData);
        profile = await this.profileRepository.findOne({
          where: { id: qrInfo.id, documentNumber: qrInfo.doc },
          relations: ['user', 'type', 'center'],
        });
      } catch (error) {
        throw new BadRequestException('Código QR inválido');
      }
    } else if (dto.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: dto.profileId },
        relations: ['user', 'type', 'center'],
      });
    }

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Verificar el último registro
    const lastRecord = await this.accessRecordRepository.findOne({
      where: { userId: profile.userId },
      order: { entryTime: 'DESC' },
    });

    let newRecord: AccessRecord;

    if (dto.type === 'entry') {
      // Verificar si ya tiene una entrada sin salida
      if (lastRecord && !lastRecord.exitTime) {
        throw new BadRequestException('El usuario ya tiene una entrada activa sin salida registrada');
      }

      // Crear nueva entrada
      newRecord = this.accessRecordRepository.create({
        userId: profile.userId,
        status: 'entry',
        entryTime: new Date(),
      });
    } else {
      // Registrar salida
      if (!lastRecord || lastRecord.exitTime) {
        throw new BadRequestException('No hay entrada activa para registrar salida');
      }

      lastRecord.exitTime = new Date();
      lastRecord.status = 'exit';
      newRecord = await this.accessRecordRepository.save(lastRecord);
    }

    if (dto.type === 'entry') {
      newRecord = await this.accessRecordRepository.save(newRecord);
    }

    return this.formatAccessRecord(newRecord, profile);
  }

  async getCurrentOccupancy() {
    // Obtener todos los registros sin salida (personas dentro)
    const activeRecords = await this.accessRecordRepository.find({
      where: {
        exitTime: IsNull(),
        status: 'entry',
      },
      relations: ['user', 'user.profile', 'user.profile.type', 'user.profile.center'],
      order: { entryTime: 'DESC' },
    });

    const formatted = activeRecords.map(record => this.formatAccessRecord(record));

    // Agrupar por tipo de personal
    const byType = activeRecords.reduce((acc, record) => {
      const typeName = record.user.profile.type.name;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activeRecords.length,
      byType,
      records: formatted,
    };
  }

  async getAccessHistory(
    page: number = 1,
    limit: number = 20,
    date?: Date,
    userId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.entryTime = Between(startOfDay, endOfDay);
    }

    if (userId) {
      where.userId = userId;
    }

    const [records, total] = await this.accessRecordRepository.findAndCount({
      where,
      relations: ['user', 'user.profile', 'user.profile.type', 'user.profile.center'],
      order: { entryTime: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: records.map(record => this.formatAccessRecord(record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccessStats(date?: Date) {
    const where: any = {};
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.entryTime = Between(startOfDay, endOfDay);
    }

    // Total de accesos del día
    const totalAccess = await this.accessRecordRepository.count({ where });

    // Personas actualmente dentro
    const currentlyInside = await this.accessRecordRepository.count({
      where: {
        exitTime: IsNull(),
        status: 'entry',
      },
    });

    // Accesos por hora del día
    const accessByHour = await this.accessRecordRepository
      .createQueryBuilder('access')
      .select('HOUR(access.entryTime)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where(date ? 'DATE(access.entryTime) = :date' : '1=1', { date })
      .groupBy('hour')
      .getRawMany();

    // Promedio de duración de visita
    const avgDuration = await this.accessRecordRepository
      .createQueryBuilder('access')
      .select('AVG(TIMESTAMPDIFF(MINUTE, access.entryTime, access.exitTime))', 'avgMinutes')
      .where('access.exitTime IS NOT NULL')
      .andWhere(date ? 'DATE(access.entryTime) = :date' : '1=1', { date })
      .getRawOne();

    return {
      totalAccess,
      currentlyInside,
      accessByHour: accessByHour.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count),
      })),
      averageDurationMinutes: Math.round(avgDuration?.avgMinutes || 0),
    };
  }

  async searchByDocument(documentNumber: string): Promise<Profile | null> {
    const profile = await this.profileRepository.findOne({
      where: { documentNumber },
      relations: ['user', 'type', 'center'],
    });

    return profile;
  }

  private formatAccessRecord(record: AccessRecord, profile?: Profile): AccessRecordResponse {
    const userProfile = profile || record.user?.profile;
    
    const duration = record.exitTime
      ? this.calculateDuration(record.entryTime, record.exitTime)
      : undefined;

    return {
      id: record.id,
      entryTime: record.entryTime,
      exitTime: record.exitTime,
      status: record.status,
      duration,
      user: {
        id: record.userId,
        email: record.user?.email || '',
        profile: {
          firstName: userProfile?.firstName || '',
          lastName: userProfile?.lastName || '',
          documentNumber: userProfile?.documentNumber || '',
          profileImage: userProfile?.profileImage,
          type: userProfile?.type?.name || '',
          center: userProfile?.center?.name || '',
        },
      },
    };
  }

  private calculateDuration(entry: Date, exit: Date): string {
    const diff = exit.getTime() - entry.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}