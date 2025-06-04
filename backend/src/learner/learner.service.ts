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

    // 🔧 VALIDAR IMAGEN AL RECUPERAR PERFIL
    if (profile.profileImage) {
      profile.profileImage = this.validateAndCleanBase64Image(profile.profileImage) || '';
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

  // 🔧 FUNCIÓN PARA VALIDAR Y LIMPIAR BASE64
  private validateAndCleanBase64Image(base64Image: string): string | null {
    try {
      if (!base64Image) return null;

      let cleanImage = base64Image.trim();

      // Si no tiene prefijo, agregarlo
      if (!cleanImage.startsWith('data:image/')) {
        if (cleanImage.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
          cleanImage = `data:image/png;base64,${cleanImage}`;
        } else {
          console.error('Imagen base64 con formato inválido');
          return null;
        }
      }

      // Validar formato
      const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanImage)) {
        console.error('Imagen base64 no cumple con el formato esperado');
        return null;
      }

      // Verificar integridad
      const base64Data = cleanImage.split(',')[1];
      if (!base64Data) {
        console.error('No se pudo extraer datos base64');
        return null;
      }

      // Intentar decodificar para verificar integridad
      Buffer.from(base64Data, 'base64');

      return cleanImage;
    } catch (error) {
      console.error('Error validando imagen base64:', error);
      return null;
    }
  }

  // 🔧 FUNCIÓN MEJORADA PARA SUBIR IMÁGENES
  async uploadProfileImage(userId: number, imageBase64: string): Promise<Profile> {
    console.log('📸 Iniciando subida de imagen para usuario:', userId);
    console.log('📸 Tamaño de imagen recibida:', imageBase64?.length || 0, 'caracteres');
    
    const profile = await this.getProfileByUserId(userId);
    
    // Validar que la imagen base64 está presente
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new BadRequestException('Imagen base64 no válida');
    }

    // Limpiar espacios y caracteres no deseados
    let cleanImageBase64 = imageBase64.trim().replace(/\s/g, '');

    console.log('📸 Imagen después de limpiar:', cleanImageBase64.substring(0, 100) + '...');

    // Validar y normalizar formato
    if (!cleanImageBase64.startsWith('data:image/')) {
      // Si es solo base64 sin prefijo, agregarlo
      if (cleanImageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        cleanImageBase64 = `data:image/png;base64,${cleanImageBase64}`;
      } else {
        throw new BadRequestException('Formato de imagen base64 no válido');
      }
    }

    // Validar formato completo
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanImageBase64)) {
      console.error('❌ Imagen no pasa validación de regex:', cleanImageBase64.substring(0, 100));
      throw new BadRequestException('Formato de imagen base64 no válido');
    }

    // Extraer datos base64 puros
    const base64Data = cleanImageBase64.split(',')[1];
    if (!base64Data) {
      throw new BadRequestException('No se pudieron extraer los datos de imagen');
    }

    // Validar tamaño
    const sizeInBytes = (base64Data.length * 0.75);
    console.log('📸 Tamaño calculado:', Math.round(sizeInBytes / 1024), 'KB');
    
    if (sizeInBytes > 2 * 1024 * 1024) {
      throw new BadRequestException('La imagen no debe superar los 2MB');
    }

    // Verificar integridad de datos
    try {
      Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('❌ Error decodificando base64:', error);
      throw new BadRequestException('Datos de imagen base64 corruptos');
    }

    // Guardar en base de datos
    try {
      profile.profileImage = cleanImageBase64;
      await this.profileRepository.save(profile);
      console.log('✅ Imagen guardada correctamente en BD');
    } catch (error) {
      console.error('❌ Error guardando en BD:', error);
      throw new BadRequestException('Error al guardar imagen en base de datos');
    }
    
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