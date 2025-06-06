// backend/src/attendance/instructor-profile.controller.ts - COMPLETO
import { Controller, Get, Put, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('instructor-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Instructor')
export class InstructorProfileController {
  constructor(private readonly profilesService: ProfilesService) {}

  // ⭐ VER MI PERFIL (INSTRUCTOR)
  @Get('me')
  async getMyProfile(@Request() req: any) {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }
      return profile;
    } catch (error) {
      throw error;
    }
  }

  // ⭐ ACTUALIZAR MI PERFIL (INSTRUCTOR)
  @Put('me')
  async updateMyProfile(
    @Request() req: any,
    @Body() data: {
      phoneNumber?: string;
      address?: string;
      city?: string;
      bloodType?: string;
      maritalStatus?: string;
      vaccine?: string;
    }
  ) {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }

      // Validar datos de entrada
      if (data.bloodType && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(data.bloodType)) {
        throw new BadRequestException('Tipo de sangre inválido');
      }

      if (data.maritalStatus && !['Soltero', 'Casado', 'Union Libre', 'Divorciado', 'Viudo'].includes(data.maritalStatus)) {
        throw new BadRequestException('Estado civil inválido');
      }

      if (data.vaccine && !['SI', 'NO'].includes(data.vaccine)) {
        throw new BadRequestException('Estado de vacunación inválido');
      }

      if (data.phoneNumber) {
        // Validar formato de teléfono (básico)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(data.phoneNumber.replace(/\D/g, ''))) {
          throw new BadRequestException('Formato de teléfono inválido. Debe tener 10 dígitos');
        }
      }

      return await this.profilesService.update(profile.id, data);
    } catch (error) {
      throw error;
    }
  }

  // ⭐ SUBIR IMAGEN DE PERFIL
  @Post('me/image')
  async uploadProfileImage(
    @Request() req: any,
    @Body() data: { profileImage: string }
  ) {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }

      // Validar que es una imagen base64 válida
      if (!data.profileImage || !data.profileImage.startsWith('data:image/')) {
        throw new BadRequestException('Formato de imagen inválido');
      }

      // Validar tamaño aproximado (base64 es ~33% más grande que el archivo original)
      const base64Data = data.profileImage.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB

      if (sizeInBytes > maxSizeInBytes) {
        throw new BadRequestException('La imagen es demasiado grande. Máximo 2MB');
      }

      return await this.profilesService.update(profile.id, {
        profileImage: data.profileImage
      });
    } catch (error) {
      throw error;
    }
  }

  // ⭐ REGENERAR CÓDIGO QR
  @Post('me/regenerate-qr')
  async regenerateQR(@Request() req: any) {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }

      // Generar nuevo código QR
      const qrData = {
        doc: profile.documentNumber,
        name: `${profile.firstName} ${profile.lastName}`,
        type: profile.type.name,
        timestamp: new Date().toISOString()
      };

      // Aquí deberías usar una librería para generar QR
      // Por ejemplo: qrcode
      const QRCode = require('qrcode');
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return await this.profilesService.update(profile.id, {
        qrCode: qrCodeDataURL
      });
    } catch (error) {
      console.error('Error generando QR:', error);
      throw new BadRequestException('Error al generar código QR');
    }
  }
}