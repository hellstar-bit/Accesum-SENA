// ⭐ CONTROLLER PARA LAS NOTIFICACIONES
// backend/src/attendance/attendance-notifications.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceNotificationsService } from './attendance-notifications.service';

@Controller('attendance/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceNotificationsController {
  constructor(
    private readonly notificationsService: AttendanceNotificationsService
  ) {}

  // ⭐ OBTENER MIS NOTIFICACIONES (INSTRUCTOR)
  @Get('my-notifications')
  @Roles('Instructor')
  async getMyNotifications(
    @Request() req: any,
    @Body() data?: { limit?: number }
  ) {
    const instructorId = req.user.id;
    const limit = data?.limit || 20;
    
    return {
      notifications: this.notificationsService.getInstructorNotifications(instructorId, limit),
      stats: this.notificationsService.getNotificationStats(instructorId)
    };
  }

  // ⭐ MARCAR NOTIFICACIONES COMO LEÍDAS
  @Post('mark-read')
  @Roles('Instructor')
  async markAsRead(
    @Request() req: any,
    @Body() data: { notificationIds: string[] }
  ) {
    const instructorId = req.user.id;
    
    this.notificationsService.markNotificationsAsRead(
      instructorId, 
      data.notificationIds
    );
    
    return { success: true, message: 'Notificaciones marcadas como leídas' };
  }

  // ⭐ OBTENER ESTADÍSTICAS DE NOTIFICACIONES
  @Get('stats')
  @Roles('Instructor')
  async getNotificationStats(@Request() req: any) {
    const instructorId = req.user.id;
    return this.notificationsService.getNotificationStats(instructorId);
  }
}
