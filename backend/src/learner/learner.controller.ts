// backend/src/learner/learner.controller.ts - ACTUALIZADO CON ENDPOINTS PARA MIS CLASES
import { Controller, Get, Put, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES } from '../auth/constants/roles.constant';
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

  // ⭐ SUBIR IMAGEN DE PERFIL (APRENDIZ)
  @Post('profile/image')
  @Roles(ROLES.LEARNER)
  async uploadProfileImage(
    @Request() req: any,
    @Body() data: { profileImage: string }
  ) {
    return await this.learnerService.uploadImage(req.user.id, data.profileImage);
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

  // ⭐ NUEVOS ENDPOINTS PARA MIS CLASES

  // GET /learner/my-classes/{date} - Obtener clases de una fecha específica
  @Get('my-classes/:date')
  @Roles(ROLES.LEARNER)
  async getMyClassesForDate(
    @Request() req: any,
    @Param('date') date: string
  ) {
    console.log(`🔍 [Controller] Obteniendo clases para ${req.user.email} en fecha: ${date}`);
    return await this.learnerService.getMyClassesForDate(req.user.id, date);
  }

  // GET /learner/attendance-stats - Obtener estadísticas de asistencia
  @Get('attendance-stats')
  @Roles(ROLES.LEARNER)
  async getAttendanceStats(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    console.log(`📊 [Controller] Obteniendo estadísticas para ${req.user.email}: ${startDate} - ${endDate}`);
    return await this.learnerService.getWeeklyAttendanceStats(req.user.id, startDate, endDate);
  }

  // GET /learner/weekly-schedule/{weekStartDate} - Obtener horario semanal
  @Get('weekly-schedule/:weekStartDate')
  @Roles(ROLES.LEARNER)
  async getWeeklySchedule(
    @Request() req: any,
    @Param('weekStartDate') weekStartDate: string
  ) {
    console.log(`📅 [Controller] Obteniendo horario semanal para ${req.user.email} desde: ${weekStartDate}`);
    return await this.learnerService.getMyWeeklySchedule(req.user.id, weekStartDate);
  }

  // GET /learner/monthly-attendance/{year}/{month} - Obtener resumen mensual
  @Get('monthly-attendance/:year/:month')
  @Roles(ROLES.LEARNER)
  async getMonthlyAttendance(
    @Request() req: any,
    @Param('year') year: string,
    @Param('month') month: string
  ) {
    console.log(`📈 [Controller] Obteniendo resumen mensual para ${req.user.email}: ${year}-${month}`);
    return await this.learnerService.getMonthlyAttendanceSummary(req.user.id, parseInt(year), parseInt(month));
  }

  // ⭐ ENDPOINT LEGACY PARA COMPATIBILIDAD
  @Get('my-classes')
  @Roles(ROLES.LEARNER)
  async getMyClassesLegacy(
    @Request() req: any,
    @Query('date') date?: string
  ) {
    console.log(`🔍 [Controller] Endpoint legacy - clases para ${req.user.email}, fecha: ${date || 'hoy'}`);
    const targetDate = date || new Date().toISOString().split('T')[0];
    return await this.learnerService.getMyClassesForDate(req.user.id, targetDate);
  }
}