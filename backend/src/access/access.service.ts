// backend/src/access/access.service.ts - CORREGIDO
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
      id: number;
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

    console.log('🔍 Creando registro de acceso:', dto);

    // ⭐ BUSCAR PERFIL POR QR O POR ID
    if (dto.qrData) {
      profile = await this.findProfileByQRData(dto.qrData);
    } else if (dto.profileId) {
      profile = await this.profileRepository.findOne({
        where: { id: dto.profileId },
        relations: ['user', 'type', 'center'],
      });
    }

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    console.log('👤 Perfil encontrado:', {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      document: profile.documentNumber
    });

    // ⭐ VERIFICAR EL ÚLTIMO REGISTRO
    const lastRecord = await this.accessRecordRepository.findOne({
      where: { userId: profile.userId },
      order: { entryTime: 'DESC' },
    });

    console.log('📋 Último registro:', lastRecord ? {
      id: lastRecord.id,
      entryTime: lastRecord.entryTime,
      exitTime: lastRecord.exitTime,
      status: lastRecord.status
    } : 'Ninguno');

    let newRecord: AccessRecord;

    if (dto.type === 'entry') {
      // ⭐ REGISTRAR ENTRADA
      if (lastRecord && !lastRecord.exitTime) {
        throw new BadRequestException(
          `${profile.firstName} ${profile.lastName} ya tiene una entrada activa sin salida registrada`
        );
      }

      newRecord = this.accessRecordRepository.create({
        userId: profile.userId,
        status: 'entry',
        entryTime: new Date(),
      });

      newRecord = await this.accessRecordRepository.save(newRecord);
      console.log('✅ Entrada registrada:', newRecord.id);

    } else {
      // ⭐ REGISTRAR SALIDA
      if (!lastRecord || lastRecord.exitTime) {
        throw new BadRequestException(
          `${profile.firstName} ${profile.lastName} no tiene entrada activa para registrar salida`
        );
      }

      lastRecord.exitTime = new Date();
      lastRecord.status = 'exit';
      newRecord = await this.accessRecordRepository.save(lastRecord);
      console.log('✅ Salida registrada:', newRecord.id);
    }

    return this.formatAccessRecord(newRecord, profile);
  }

  // ⭐ NUEVA FUNCIÓN - Buscar perfil por datos QR con validación mejorada
  private async findProfileByQRData(qrData: string): Promise<Profile | null> {
    try {
      console.log('🔍 Procesando datos QR:', qrData);
      
      // ⭐ LIMPIAR Y VALIDAR DATOS QR
      const cleanQRData = this.cleanQRData(qrData);
      console.log('🧹 Datos QR limpios:', cleanQRData);
      
      let qrInfo: any;
      try {
        qrInfo = JSON.parse(cleanQRData);
      } catch (parseError) {
        console.error('❌ Error parsing QR JSON:', parseError);
        throw new BadRequestException('Formato de código QR inválido');
      }

      console.log('📋 Información extraída del QR:', qrInfo);

      // ⭐ VALIDAR ESTRUCTURA DEL QR
      if (!qrInfo || typeof qrInfo !== 'object') {
        throw new BadRequestException('Código QR no contiene datos válidos');
      }

      if (!qrInfo.doc) {
        throw new BadRequestException('Código QR no contiene número de documento');
      }

      // ⭐ VALIDAR TIPO DE QR
      if (qrInfo.type && !qrInfo.type.includes('ACCESUM_SENA')) {
        throw new BadRequestException('Código QR no es del sistema ACCESUM');
      }

      // ⭐ BUSCAR PERFIL POR NÚMERO DE DOCUMENTO
      const profile = await this.profileRepository.findOne({
        where: { documentNumber: qrInfo.doc.toString() },
        relations: ['user', 'type', 'center'],
      });

      if (!profile) {
        throw new NotFoundException(`No se encontró perfil con documento: ${qrInfo.doc}`);
      }

      // ⭐ VALIDAR ESTADO DEL USUARIO
      if (!profile.user.isActive) {
        throw new BadRequestException(`Usuario ${profile.firstName} ${profile.lastName} está inactivo`);
      }

      // ⭐ VALIDAR QR ESPECÍFICO SI TIENE ID
      if (qrInfo.id && qrInfo.id !== profile.id) {
        console.warn('⚠️ ID del QR no coincide con el perfil encontrado');
        // No lanzar error, solo advertencia - usar el perfil encontrado por documento
      }

      console.log('✅ Perfil válido encontrado:', {
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        document: profile.documentNumber,
        type: profile.type.name,
        userActive: profile.user.isActive
      });

      return profile;

    } catch (error) {
      console.error('❌ Error en findProfileByQRData:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error procesando código QR: ${error.message}`);
    }
  }

  // ⭐ NUEVA FUNCIÓN - Limpiar datos QR
  private cleanQRData(rawData: string): string {
    try {
      // Remover espacios y caracteres no imprimibles
      let cleanData = rawData.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Si ya es JSON válido, devolverlo
      try {
        JSON.parse(cleanData);
        return cleanData;
      } catch {
        // No es JSON válido, continuar con limpieza
      }

      // Intentar extraer JSON de una cadena más larga
      const jsonMatch = cleanData.match(/\{.*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }

      // Si es solo un número, crear estructura básica
      const numberMatch = cleanData.match(/^\d+$/);
      if (numberMatch) {
        return JSON.stringify({
          id: null,
          doc: numberMatch[0],
          type: 'ACCESUM_SENA_MANUAL',
          timestamp: Date.now()
        });
      }

      // Intentar decodificar URL
      try {
        const decoded = decodeURIComponent(cleanData);
        if (decoded !== cleanData) {
          return this.cleanQRData(decoded);
        }
      } catch {
        // No es URL encoded
      }

      throw new Error('No se pudo procesar el formato del QR');
    } catch (error) {
      console.error('❌ Error limpiando datos QR:', error);
      throw error;
    }
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
      .where(date ? 'DATE(access.entryTime) = :date' : '1=1', { 
        date: date ? date.toISOString().split('T')[0] : undefined 
      })
      .groupBy('hour')
      .getRawMany();

    // Promedio de duración de visita
    const avgDuration = await this.accessRecordRepository
      .createQueryBuilder('access')
      .select('AVG(TIMESTAMPDIFF(MINUTE, access.entryTime, access.exitTime))', 'avgMinutes')
      .where('access.exitTime IS NOT NULL')
      .andWhere(date ? 'DATE(access.entryTime) = :date' : '1=1', { 
        date: date ? date.toISOString().split('T')[0] : undefined 
      })
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
    console.log('🔍 Buscando por documento:', documentNumber);
    
    if (!documentNumber || !documentNumber.trim()) {
      throw new BadRequestException('Número de documento requerido');
    }

    const cleanDocument = documentNumber.trim().replace(/\D/g, ''); // Solo números
    
    if (!cleanDocument) {
      throw new BadRequestException('Número de documento inválido');
    }

    const profile = await this.profileRepository.findOne({
      where: { documentNumber: cleanDocument },
      relations: ['user', 'type', 'center'],
    });

    if (!profile) {
      console.log('❌ No se encontró perfil con documento:', cleanDocument);
      return null;
    }

    if (!profile.user.isActive) {
      throw new BadRequestException(`Usuario ${profile.firstName} ${profile.lastName} está inactivo`);
    }

    console.log('✅ Perfil encontrado:', {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      document: profile.documentNumber
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
      exitTime: record.exitTime || undefined,
      status: record.status,
      duration,
      user: {
        id: record.userId,
        email: record.user?.email || '',
        profile: {
          id: userProfile?.id || 0,
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