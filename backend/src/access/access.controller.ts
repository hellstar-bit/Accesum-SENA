// backend/src/access/access.controller.ts - CORREGIDO
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessService } from './access.service';
import type { CreateAccessRecordDto } from './access.service';

@Controller('access')
@UseGuards(JwtAuthGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(@Body() dto: any) {
    console.log('🚪 Solicitud de entrada:', dto);
    
    // ⭐ VALIDAR DATOS DE ENTRADA
    if (!dto.qrData && !dto.profileId) {
      throw new BadRequestException('Se requiere qrData o profileId');
    }

    // ⭐ LIMPIAR Y VALIDAR DATOS
    const cleanDto: CreateAccessRecordDto = {
      type: 'entry',
      qrData: dto.qrData ? dto.qrData.trim() : undefined,
      profileId: dto.profileId ? parseInt(dto.profileId) : undefined,
    };

    // Validar que profileId sea un número válido si se proporciona
    if (dto.profileId && (isNaN(cleanDto.profileId!) || cleanDto.profileId! <= 0)) {
      throw new BadRequestException('profileId debe ser un número válido');
    }

    try {
      const result = await this.accessService.createAccessRecord(cleanDto);
      console.log('✅ Entrada registrada exitosamente:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ Error en check-in:', error.message);
      throw error;
    }
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  async checkOut(@Body() dto: any) {
    console.log('🚪 Solicitud de salida:', dto);
    
    // ⭐ VALIDAR DATOS DE SALIDA
    if (!dto.qrData && !dto.profileId) {
      throw new BadRequestException('Se requiere qrData o profileId');
    }

    // ⭐ LIMPIAR Y VALIDAR DATOS
    const cleanDto: CreateAccessRecordDto = {
      type: 'exit',
      qrData: dto.qrData ? dto.qrData.trim() : undefined,
      profileId: dto.profileId ? parseInt(dto.profileId) : undefined,
    };

    // Validar que profileId sea un número válido si se proporciona
    if (dto.profileId && (isNaN(cleanDto.profileId!) || cleanDto.profileId! <= 0)) {
      throw new BadRequestException('profileId debe ser un número válido');
    }

    try {
      const result = await this.accessService.createAccessRecord(cleanDto);
      console.log('✅ Salida registrada exitosamente:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ Error en check-out:', error.message);
      throw error;
    }
  }

  @Get('current')
  async getCurrentOccupancy() {
    try {
      return await this.accessService.getCurrentOccupancy();
    } catch (error: any) {
      console.error('❌ Error obteniendo ocupación actual:', error.message);
      throw error;
    }
  }

  @Get('history')
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    try {
      // ⭐ VALIDAR Y LIMPIAR PARÁMETROS
      const cleanPage = page ? parseInt(page) : 1;
      const cleanLimit = limit ? parseInt(limit) : 20;
      const cleanUserId = userId ? parseInt(userId) : undefined;
      
      // Validar números
      if (page && (isNaN(cleanPage) || cleanPage < 1)) {
        throw new BadRequestException('page debe ser un número mayor a 0');
      }
      
      if (limit && (isNaN(cleanLimit) || cleanLimit < 1 || cleanLimit > 100)) {
        throw new BadRequestException('limit debe ser un número entre 1 y 100');
      }
      
      if (userId && (isNaN(cleanUserId!) || cleanUserId! <= 0)) {
        throw new BadRequestException('userId debe ser un número válido');
      }

      // Validar fecha
      let cleanDate: Date | undefined;
      if (date) {
        cleanDate = new Date(date);
        if (isNaN(cleanDate.getTime())) {
          throw new BadRequestException('Formato de fecha inválido');
        }
      }

      return await this.accessService.getAccessHistory(
        cleanPage,
        cleanLimit,
        cleanDate,
        cleanUserId,
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Error obteniendo historial:', error.message);
      throw new BadRequestException('Error al obtener historial de acceso');
    }
  }

  @Get('stats')
  async getStats(@Query('date') date?: string) {
    try {
      // ⭐ VALIDAR FECHA SI SE PROPORCIONA
      let cleanDate: Date | undefined;
      if (date) {
        cleanDate = new Date(date);
        if (isNaN(cleanDate.getTime())) {
          throw new BadRequestException('Formato de fecha inválido');
        }
      }

      return await this.accessService.getAccessStats(cleanDate);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Error obteniendo estadísticas:', error.message);
      throw new BadRequestException('Error al obtener estadísticas de acceso');
    }
  }

  @Get('search/:document')
  async searchByDocument(@Param('document') documentNumber: string) {
    try {
      // ⭐ VALIDAR NÚMERO DE DOCUMENTO
      if (!documentNumber || !documentNumber.trim()) {
        throw new BadRequestException('Número de documento requerido');
      }

      // Limpiar documento (solo números)
      const cleanDocument = documentNumber.trim().replace(/\D/g, '');
      
      if (!cleanDocument) {
        throw new BadRequestException('Número de documento debe contener al menos un dígito');
      }

      if (cleanDocument.length < 6 || cleanDocument.length > 15) {
        throw new BadRequestException('Número de documento debe tener entre 6 y 15 dígitos');
      }

      console.log('🔍 Buscando documento:', cleanDocument);
      
      const profile = await this.accessService.searchByDocument(cleanDocument);
      
      if (!profile) {
        return { 
          found: false, 
          message: `No se encontró ninguna persona con documento: ${cleanDocument}` 
        };
      }

      return {
        found: true,
        profile: {
          id: profile.id,
          fullName: `${profile.firstName} ${profile.lastName}`,
          documentNumber: profile.documentNumber,
          type: profile.type.name,
          center: profile.center.name,
          profileImage: profile.profileImage,
          isActive: profile.user.isActive,
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Error en búsqueda por documento:', error.message);
      throw new BadRequestException('Error al buscar por documento');
    }
  }

  // ⭐ NUEVO ENDPOINT - Validar código QR
  @Post('validate-qr')
  @HttpCode(HttpStatus.OK)
  async validateQR(@Body() dto: { qrData: string }) {
    try {
      if (!dto.qrData) {
        throw new BadRequestException('qrData es requerido');
      }

      // Intentar procesar el QR sin crear registro
      // Esto nos permite validar el QR antes de usarlo
      const cleanQRData = dto.qrData.trim();
      
      let qrInfo;
      try {
        qrInfo = JSON.parse(cleanQRData);
      } catch {
        throw new BadRequestException('Formato de código QR inválido');
      }

      if (!qrInfo.doc) {
        throw new BadRequestException('Código QR no contiene número de documento');
      }

      const profile = await this.accessService.searchByDocument(qrInfo.doc);
      
      if (!profile) {
        throw new BadRequestException(`No se encontró perfil con documento: ${qrInfo.doc}`);
      }

      return {
        valid: true,
        profile: {
          id: profile.id,
          fullName: `${profile.firstName} ${profile.lastName}`,
          documentNumber: profile.documentNumber,
          type: profile.type.name,
        },
      };
    } catch (error: any) {
      console.error('❌ Error validando QR:', error.message);
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}