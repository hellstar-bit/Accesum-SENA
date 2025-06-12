// backend/src/attendance/instructor-profile.controller.ts - COMPLETO CORREGIDO
import { Controller, Get, Put, Post, Body, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProfilesService } from '../profiles/profiles.service';
import { AttendanceService } from './attendance.service';

// ⭐ DEFINIR TIPOS LOCALMENTE PARA EVITAR EL ERROR TS4053
interface ScheduleItem {
  id: number;
  startTime: string;
  endTime: string;
  classroom: string;
  competence: {
    id: number;
    name: string;
  };
  ficha: {
    id: number;
    code: string;
    name: string;
  };
}

interface WeeklyScheduleLocal {
  LUNES: ScheduleItem[];
  MARTES: ScheduleItem[];
  MIERCOLES: ScheduleItem[];
  JUEVES: ScheduleItem[];
  VIERNES: ScheduleItem[];
  SABADO: ScheduleItem[];
}

interface InstructorScheduleResponse {
  instructor: {
    id: number;
    name: string;
    documentNumber: string;
  };
  trimester: string;
  schedules: WeeklyScheduleLocal;
}

@Controller('instructor-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Instructor')
export class InstructorProfileController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly attendanceService: AttendanceService
  ) {}

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

  // ⭐ OBTENER MIS HORARIOS DEL TRIMESTRE - CON TIPO LOCAL
  @Get('me/schedules')
  async getMySchedules(
    @Request() req: any,
    @Query('trimester') trimester?: string
  ): Promise<InstructorScheduleResponse> {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }

      // Si no se proporciona trimestre, usar el actual
      const currentTrimester = trimester || this.getCurrentTrimester();
      
      // Obtener horarios del instructor usando el AttendanceService
      const schedules = await this.attendanceService.getInstructorTrimesterSchedules(
        req.user.id, 
        currentTrimester
      );

      return {
        instructor: {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          documentNumber: profile.documentNumber
        },
        trimester: currentTrimester,
        schedules: schedules as WeeklyScheduleLocal
      };
    } catch (error) {
      console.error('Error al obtener horarios del instructor:', error);
      throw error;
    }
  }

  // ⭐ OBTENER MIS FICHAS ASIGNADAS
  @Get('me/assignments')
  async getMyAssignments(@Request() req: any): Promise<any[]> {
    try {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new BadRequestException('Perfil no encontrado');
      }

      const assignments = await this.attendanceService.getInstructorFichas(req.user.id);
      return assignments;
    } catch (error) {
      console.error('Error al obtener asignaciones del instructor:', error);
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

  // ⭐ MÉTODO PRIVADO PARA OBTENER TRIMESTRE ACTUAL
  private getCurrentTrimester(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Lógica simple para determinar trimestre
    if (month >= 1 && month <= 4) return `${year}-1`;
    if (month >= 5 && month <= 8) return `${year}-2`;
    return `${year}-3`;
  }
}
