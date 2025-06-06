// backend/src/learner/learner.controller.ts - CORREGIDO
import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES } from 'src/auth/constants/roles.constant';// ✅ Importar constantes
import { LearnerService } from './learner.service';


@Controller('learner')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  // ⭐ VER MI PERFIL (APRENDIZ)
  @Get('profile')
  @Roles(ROLES.LEARNER) // ✅ Usar constante en lugar de string
  async getMyProfile(@Request() req: any) {
    return await this.learnerService.getMyProfile(req.user.id);
  }

  // ⭐ ACTUALIZAR MI PERFIL (APRENDIZ)
  @Put('profile')
  @Roles(ROLES.LEARNER) // ✅ Usar constante en lugar de string
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

  // ⭐ SUBIR IMAGEN DE PERFIL (APRENDIZ)
  @Post('profile/image')
  @Roles(ROLES.LEARNER) // ✅ Usar constante en lugar de string
  async uploadImage(
    @Request() req: any,
    @Body() data: { profileImage: string }
  ) {
    return await this.learnerService.uploadImage(req.user.id, data.profileImage);
  }

  // ⭐ REGENERAR CÓDIGO QR (APRENDIZ)
  @Post('profile/regenerate-qr')
  @Roles(ROLES.LEARNER) // ✅ Usar constante en lugar de string
  async regenerateQR(@Request() req: any) {
    return await this.learnerService.regenerateQR(req.user.id);
  }

  // ⭐ OBTENER MIS CLASES (APRENDIZ)
  @Get('my-classes')
  @Roles(ROLES.LEARNER) // ✅ Usar constante en lugar de string
  async getMyClasses(
    @Request() req: any,
    @Body() data: { date?: string }
  ) {
    return await this.learnerService.getMyClasses(req.user.id, data.date);
  }
}