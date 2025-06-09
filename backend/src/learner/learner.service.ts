// backend/src/learner/learner.service.ts - COMPLETO
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import * as QRCode from 'qrcode';

export interface UpdateLearnerProfileDto {
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
}

export interface LearnerClass {
  id: number;
  subject: string;
  instructor: string;
  date: Date;
  startTime: string;
  endTime: string;
  classroom?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'PENDING';
}

@Injectable()
export class LearnerService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ⭐ OBTENER MI PERFIL
  async getMyProfile(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'type',
        'regional',
        'center',
        'coordination',
        'program',
        'ficha',
        'ficha.program'
      ]
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  // ⭐ ACTUALIZAR MI PERFIL
  async updateMyProfile(userId: number, data: UpdateLearnerProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Actualizar solo los campos permitidos
    if (data.phoneNumber !== undefined) profile.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) profile.address = data.address;
    if (data.city !== undefined) profile.city = data.city;
    if (data.bloodType !== undefined) profile.bloodType = data.bloodType;
    if (data.maritalStatus !== undefined) profile.maritalStatus = data.maritalStatus;
    if (data.vaccine !== undefined) profile.vaccine = data.vaccine;

    const updatedProfile = await this.profileRepository.save(profile);

    // Retornar el perfil completo con relaciones
    return await this.getMyProfile(userId);
  }

  // ⭐ SUBIR IMAGEN DE PERFIL
  async uploadImage(userId: number, imageBase64: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Validar que sea una imagen base64 válida
    if (!this.isValidBase64Image(imageBase64)) {
      throw new BadRequestException('Formato de imagen inválido');
    }

    profile.profileImage = imageBase64;
    await this.profileRepository.save(profile);

    return await this.getMyProfile(userId);
  }

  // ⭐ REGENERAR CÓDIGO QR
  async regenerateQR(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    try {
      // Generar datos para el QR
      const qrData = {
        id: profile.id,
        doc: profile.documentNumber,
        type: 'ACCESUM_SENA_LEARNER',
        timestamp: Date.now()
      };

      // Generar código QR
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      profile.qrCode = qrCodeDataURL;
      await this.profileRepository.save(profile);

      return await this.getMyProfile(userId);
    } catch (error) {
      throw new BadRequestException('Error al generar código QR');
    }
  }

  // ⭐ OBTENER MIS CLASES
  async getMyClasses(userId: number, date?: string): Promise<LearnerClass[]> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['ficha']
    });

    if (!profile || !profile.ficha) {
      return [];
    }

    // TODO: Implementar lógica para obtener clases del aprendiz
    // Por ahora retornamos datos de ejemplo
    const targetDate = date ? new Date(date) : new Date();
    
    const mockClasses: LearnerClass[] = [
      {
        id: 1,
        subject: 'Programación Web',
        instructor: 'Juan Pérez',
        date: targetDate,
        startTime: '08:00',
        endTime: '12:00',
        classroom: 'Aula 101',
        status: 'PENDING'
      },
      {
        id: 2,
        subject: 'Bases de Datos',
        instructor: 'María García',
        date: targetDate,
        startTime: '14:00',
        endTime: '17:00',
        classroom: 'Aula 205',
        status: 'PENDING'
      }
    ];

    return mockClasses;
  }

  // ⭐ VALIDAR IMAGEN BASE64
  private isValidBase64Image(base64String: string): boolean {
    try {
      // Verificar que sea una cadena base64 válida de imagen
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(base64String);
    } catch {
      return false;
    }
  }

  // ⭐ BUSCAR PERFIL POR USUARIO (método auxiliar)
  async findByUserId(userId: number): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'type',
        'regional',
        'center',
        'coordination',
        'program',
        'ficha'
      ]
    });
  }
  async getCarnetData(userId: number): Promise<any> {
  const profile = await this.profileRepository.findOne({
    where: { userId },
    relations: [
      'user',
      'type',
      'regional',
      'center',
      'ficha'
    ]
  });

  if (!profile) {
    throw new NotFoundException('Perfil no encontrado');
  }

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
    } : undefined,
    type: profile.type.name,
    center: profile.center.name,
    regional: profile.regional.name,
    status: profile.learnerStatus,
    isActive: profile.user.isActive
  };
  }
}