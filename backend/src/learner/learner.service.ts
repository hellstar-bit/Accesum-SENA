// backend/src/learner/learner.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async uploadProfileImage(userId: number, imageBase64: string): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    
    // Validar tamaño de imagen (aproximado en base64)
    const sizeInBytes = (imageBase64.length * 0.75); // base64 es ~75% eficiente
    if (sizeInBytes > 2 * 1024 * 1024) { // 2MB límite
      throw new ForbiddenException('La imagen no debe superar los 2MB');
    }

    profile.profileImage = imageBase64;
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