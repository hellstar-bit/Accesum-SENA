// backend/src/attendance/attendance.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('my-classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Instructor')
  async getMyClasses(
  @Request() req: any,
  @Query('date') date?: string
) {
  try {
    console.log(`🌐 GET /attendance/my-classes?date=${date}`);
    const classes = await this.attendanceService.getMyClassesAttendance(req.user.id, date);
    console.log('✅ Clases del instructor obtenidas exitosamente');
    return classes;
  } catch (error) {
    console.error('❌ Error al obtener clases del instructor:', error);
    throw error;
  }
}

  // ⭐ NUEVA RUTA - OBTENER MIS CLASES Y ASISTENCIA (INSTRUCTOR)
  @Get('my-classes')
  @Roles('Instructor')
  async getMyClassesAttendance(
    @Query('date') date?: string,
    @Request() req?: any
  ) {
    // Obtener el ID del instructor desde el token JWT
    const instructorId = req.user.id;
    
    return await this.attendanceService.getInstructorAttendance(
      instructorId,
      date ? new Date(date) : new Date()
    );
  }

  // ⭐ MARCAR ASISTENCIA MANUAL
  @Post('mark')
  @Roles('Administrador', 'Instructor')
  async markAttendance(@Body() data: {
    scheduleId: number;
    profileId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE';
    notes?: string;
  }) {
    return await this.attendanceService.markAttendance(data);
  }

  // ⭐ OBTENER ASISTENCIA DE UNA CLASE
  @Get('schedule/:scheduleId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceBySchedule(@Param('scheduleId') scheduleId: number) {
    return await this.attendanceService.getAttendanceBySchedule(scheduleId);
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  @Get('stats/:assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceStats(
    @Param('assignmentId') assignmentId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.attendanceService.getAttendanceStats(
      assignmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ⭐ OBTENER REPORTE DE ASISTENCIA
  @Get('report/:assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceReport(
    @Param('assignmentId') assignmentId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.attendanceService.getAttendanceReport(
      assignmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA (desde control de acceso)
  @Post('auto-mark')
  async autoMarkAttendance(@Body() data: {
    profileId: number;
    entryTime: Date;
  }) {
    return await this.attendanceService.autoMarkAttendance(data.profileId, data.entryTime);
  }
  // ⭐ AGREGAR EN attendance.controller.ts
  @Get('instructor-dashboard')
  @Roles('Instructor')
  async getInstructorDashboard(@Request() req: any) {
    const instructorId = req.user.id;
    return await this.attendanceService.getInstructorDashboardStats(instructorId);
  }

}
