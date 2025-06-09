// backend/src/profiles/profiles.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { IsNull, Not } from 'typeorm';

export interface CreateProfileDto {
  profileImage?: string;
  qrCode?: string;
  userId: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  bloodType?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  maritalStatus?: string;
  sex?: string;
  vaccine?: string;
  typeId: number;
  regionalId: number;
  centerId: number;
  coordinationId?: number;
  programId?: number;
  fichaId?: number;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}

export interface ProfilesResponse {
  data: Profile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<ProfilesResponse> {
    const skip = (page - 1) * limit;
    
    const query = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.type', 'type')
      .leftJoinAndSelect('profile.regional', 'regional')
      .leftJoinAndSelect('profile.center', 'center')
      .leftJoinAndSelect('profile.coordination', 'coordination')
      .leftJoinAndSelect('profile.program', 'program')
      .leftJoinAndSelect('profile.ficha', 'ficha')
      .skip(skip)
      .take(limit);

    if (search) {
      query.where(
        'profile.firstName LIKE :search OR profile.lastName LIKE :search OR profile.documentNumber LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [profiles, total] = await query.getManyAndCount();

    return {
      data: profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user', 'type', 'regional', 'center', 'coordination', 'program', 'ficha'],
    });

    if (!profile) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }

    return profile;
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user', 'type', 'regional', 'center', 'coordination', 'program', 'ficha'],
    });

    if (!profile) {
      throw new NotFoundException(`Perfil para usuario ${userId} no encontrado`);
    }

    return profile;
  }

  async update(id: number, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id);

    // Verificar si el documento ya existe en otro perfil
    if (updateProfileDto.documentNumber && updateProfileDto.documentNumber !== profile.documentNumber) {
      const existingProfile = await this.profileRepository.findOne({
        where: { documentNumber: updateProfileDto.documentNumber },
      });

      if (existingProfile && existingProfile.id !== id) {
        throw new ConflictException('El número de documento ya está en uso');
      }
    }

    // Actualizar perfil
    Object.assign(profile, updateProfileDto);
    
    // Regenerar QR si cambió el documento
    if (updateProfileDto.documentNumber) {
      profile.qrCode = await this.generateQRCode(profile.id, updateProfileDto.documentNumber);
    }

    await this.profileRepository.save(profile);
    return this.findOne(id);
  }

  async generateQRCode(profileId: number, documentNumber: string): Promise<string> {
    // Crear datos únicos para el QR
    const qrData = {
      id: profileId,
      doc: documentNumber,
      type: 'ACCESUM_SENA',
      timestamp: Date.now()
    };

    try {
      // Generar QR como base64
      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return qrCodeBase64;
    } catch (error) {
      console.error('Error generando QR:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  async regenerateQRCode(profileId: number): Promise<Profile> {
    const profile = await this.findOne(profileId);
    
    profile.qrCode = await this.generateQRCode(profile.id, profile.documentNumber);
    await this.profileRepository.save(profile);
    
    return profile;
  }

  // 🔧 FUNCIÓN CORREGIDA PARA MANEJAR IMÁGENES EN PERFILES
  async uploadProfileImage(profileId: number, imageBase64: string): Promise<Profile> {
    const profile = await this.findOne(profileId);
    
    // Validar que la imagen base64 está presente
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new BadRequestException('Imagen base64 no válida');
    }

    // Limpiar y validar formato base64
    let cleanImageBase64 = imageBase64.trim();

    // Si no tiene el prefijo data:, agregarlo
    if (!cleanImageBase64.startsWith('data:image/')) {
      // Verificar si es solo la parte base64 sin el prefijo
      if (cleanImageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        cleanImageBase64 = `data:image/png;base64,${cleanImageBase64}`;
      } else {
        throw new BadRequestException('Formato de imagen base64 no válido');
      }
    }

    // Validar que el formato sea correcto
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageBase64)) {
      throw new BadRequestException('Formato de imagen base64 no válido');
    }

    // Extraer solo la parte base64 para validar tamaño
    const base64Data = cleanImageBase64.split(',')[1];
    if (!base64Data) {
      throw new BadRequestException('Datos de imagen base64 no válidos');
    }

    // Validar tamaño de imagen (aproximado en base64)
    const sizeInBytes = (base64Data.length * 0.75); // base64 es ~75% eficiente
    if (sizeInBytes > 2 * 1024 * 1024) { // 2MB límite
      throw new BadRequestException('La imagen no debe superar los 2MB');
    }

    // Validar que el base64 no esté corrupto
    try {
      // Intentar decodificar para verificar integridad
      Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('Datos de imagen base64 corruptos');
    }

    // Guardar la imagen con formato limpio
    profile.profileImage = cleanImageBase64;
    await this.profileRepository.save(profile);
    
    return profile;
  }

  async getProfileStats() {
    const totalProfiles = await this.profileRepository.count();
    
    const profilesByType = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.type', 'type')
      .select('type.name', 'typeName')
      .addSelect('COUNT(profile.id)', 'count')
      .groupBy('type.name')
      .getRawMany();

    const profilesByRegional = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.regional', 'regional')
      .select('regional.name', 'regionalName')
      .addSelect('COUNT(profile.id)', 'count')
      .groupBy('regional.name')
      .getRawMany();

    const profilesWithQR = await this.profileRepository.count({
      where: { qrCode: Not(IsNull()) }
    });

    return {
      totalProfiles,
      profilesByType,
      profilesByRegional,
      profilesWithQR,
      profilesWithoutQR: totalProfiles - profilesWithQR,
    };
  }
}