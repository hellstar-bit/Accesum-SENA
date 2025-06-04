// backend/src/learner/learner.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

export interface UpdateLearnerProfileDto {
  // Campos editables por el aprendiz
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
  // Campos NO editables (core):
  // documentType, documentNumber, firstName, lastName, email, fichaId, etc.
}

@Injectable()
export class LearnerService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfileByUserId(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user', 
        'type', 
        'regional', 
        'center', 
        'ficha', 
        'ficha.program',
        'coordination',
        'program'
      ],
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Verificar que sea aprendiz
    if (profile.type.name !== 'Aprendiz') {
      throw new ForbiddenException('Acceso solo para aprendices');
    }

    return profile;
  }

  async updateLearnerProfile(userId: number, updateData: UpdateLearnerProfileDto): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);

    // Lista de campos que SÍ puede editar el aprendiz
    const editableFields = [
      'phoneNumber', 
      'address', 
      'city', 
      'bloodType', 
      'maritalStatus', 
      'vaccine'
    ];

    // Filtrar solo los campos editables
    const filteredData = Object.keys(updateData)
      .filter(key => editableFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    // Actualizar perfil
    Object.assign(profile, filteredData);
    await this.profileRepository.save(profile);

    return this.getProfileByUserId(userId);
  }

  async regenerateQRCode(userId: number): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    
    // Generar nuevo QR
    const qrData = {
      id: profile.id,
      doc: profile.documentNumber,
      type: 'ACCESUM_SENA',
      timestamp: Date.now()
    };

    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    profile.qrCode = qrCodeBase64;
    await this.profileRepository.save(profile);
    
    return profile;
  }

  // 🔧 FUNCIÓN CORREGIDA PARA VALIDAR Y PROCESAR IMÁGENES
  async uploadProfileImage(userId: number, imageBase64: string): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    
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

  async getCarnetData(userId: number) {
    const profile = await this.getProfileByUserId(userId);
    
    return {
      id: profile.id,
      fullName: `${profile.firstName} ${profile.lastName}`,
      documentType: profile.documentType,
      documentNumber: profile.documentNumber,
      bloodType: profile.bloodType,
      profileImage: profile.profileImage,
      qrCode: profile.qrCode,
      ficha: profile.ficha ? {
        code: profile.ficha.code,
        name: profile.ficha.name,
        status: profile.ficha.status
      } : null,
      type: profile.type.name,
      center: profile.center.name,
      regional: profile.regional.name,
      status: profile.learnerStatus,
      isActive: profile.user.isActive
    };
  }
}