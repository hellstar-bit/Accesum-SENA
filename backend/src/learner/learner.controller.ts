// backend/src/learner/learner.controller.ts
import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  UseGuards, 
  Request,
  Post,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LearnerService } from './learner.service';

@Controller('learner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.APRENDIZ) // 🎓 Solo aprendices
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Get('profile')
  async getMyProfile(@Request() req: any) {
    // Obtener perfil del aprendiz logueado
    return this.learnerService.getProfileByUserId(req.user.id);
  }

  @Patch('profile')
  async updateMyProfile(@Request() req: any, @Body() updateData: any) {
    // Actualizar solo campos editables
    return this.learnerService.updateLearnerProfile(req.user.id, updateData);
  }

  @Post('regenerate-qr')
  async regenerateMyQR(@Request() req: any) {
    // Regenerar código QR
    return this.learnerService.regenerateQRCode(req.user.id);
  }

  @Post('upload-image')
  async uploadProfileImage(
    @Request() req: any, 
    @Body('image') imageBase64: string
  ) {
    if (!imageBase64) {
      throw new BadRequestException('No se proporcionó imagen');
    }
    return this.learnerService.uploadProfileImage(req.user.id, imageBase64);
  }

  @Get('carnet')
  async getCarnetData(@Request() req: any) {
    // Datos para generar carnet
    return this.learnerService.getCarnetData(req.user.id);
  }
}