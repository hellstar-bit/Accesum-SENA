// backend/src/learner/learner.controller.ts - AGREGAR IMPORTS Y CORREGIR ENDPOINT
import { Controller, Get, Put, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES } from 'src/auth/constants/roles.constant';
import { LearnerService } from './learner.service';

@Controller('learner')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  // ⭐ VER MI PERFIL (APRENDIZ)
  @Get('profile')
  @Roles(ROLES.LEARNER)
  async getMyProfile(@Request() req: any) {
    return await this.learnerService.getMyProfile(req.user.id);
  }

  // ⭐ ACTUALIZAR MI PERFIL (APRENDIZ)
  @Put('profile')
  @Roles(ROLES.LEARNER)
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
    return await this.learnerService.updateMyProfile(req.user.id, data);
  }

  // ⭐ SUBIR IMAGEN DE PERFIL (APRENDIZ) - CORREGIDO
  @Post('profile/image')
  @Roles(ROLES.LEARNER)
  async uploadProfileImage(
    @Request() req: any,
    @Body() data: { profileImage: string }
  ) {
    return await this.learnerService.uploadImage(req.user.id, data.profileImage);
  }

  // ⭐ ENDPOINT ALTERNATIVO PARA COMPATIBILIDAD
  @Post('upload-image')
  @Roles(ROLES.LEARNER)
  async uploadImage(
    @Request() req: any,
    @Body() data: { image?: string; profileImage?: string }
  ) {
    const imageData = data.image || data.profileImage;
    if (!imageData) {
      throw new Error('No se proporcionó imagen');
    }
    return await this.learnerService.uploadImage(req.user.id, imageData);
  }

  // ⭐ REGENERAR CÓDIGO QR (APRENDIZ)
  @Post('profile/regenerate-qr')
  @Roles(ROLES.LEARNER)
  async regenerateQR(@Request() req: any) {
    return await this.learnerService.regenerateQR(req.user.id);
  }

  // ⭐ OBTENER DATOS PARA CARNET
  @Get('carnet')
  @Roles(ROLES.LEARNER)
  async getCarnetData(@Request() req: any) {
    return await this.learnerService.getCarnetData(req.user.id);
  }

  // ⭐ OBTENER MIS CLASES (APRENDIZ)
  @Get('my-classes')
  @Roles(ROLES.LEARNER)
  async getMyClasses(
    @Request() req: any,
    @Body() data: { date?: string }
  ) {
    return await this.learnerService.getMyClasses(req.user.id, data.date);
  }
}