// backend/src/attendance/attendance.controller.ts - COMPLETO
import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ⭐ OBTENER MIS CLASES Y ASISTENCIA (INSTRUCTOR)
  @Get('my-classes')
  @Roles('Instructor')
  async getMyClassesAttendance(
    @Query('date') date?: string,
    @Request() req?: any
  ) {
    try {
      console.log(`🌐 GET /attendance/my-classes?date=${date}`);
      
      // Obtener el ID del instructor desde el token JWT
      const instructorId = req.user.id;
      
      const result = await this.attendanceService.getMyClassesAttendance(
        instructorId,
        date
      );
      
      console.log('✅ Clases del instructor obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener clases del instructor:', error);
      // Retornar array vacío en lugar de error para no romper el frontend
      return [];
    }
  }

  // ⭐ MARCAR ASISTENCIA MANUAL
  @Post('mark')
  @Roles('Administrador', 'Instructor')
  async markAttendance(@Body() data: {
    scheduleId: number;
    profileId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE';
    notes?: string;
    markedBy?: number;
  }) {
    try {
      console.log('🌐 POST /attendance/mark');
      const result = await this.attendanceService.markAttendance(data);
      console.log('✅ Asistencia marcada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al marcar asistencia:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ASISTENCIA DE UNA CLASE
  @Get('schedule/:scheduleId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceBySchedule(@Param('scheduleId') scheduleId: number) {
    try {
      console.log(`🌐 GET /attendance/schedule/${scheduleId}`);
      const result = await this.attendanceService.getAttendanceBySchedule(scheduleId);
      console.log('✅ Asistencia de clase obtenida exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener asistencia de clase:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASISTENCIA
  @Get('stats/:assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceStats(
    @Param('assignmentId') assignmentId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      console.log(`🌐 GET /attendance/stats/${assignmentId}`);
      const result = await this.attendanceService.getAttendanceStats(
        assignmentId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      console.log('✅ Estadísticas de asistencia obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de asistencia:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DE ASISTENCIA
  @Get('report/:assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAttendanceReport(
    @Param('assignmentId') assignmentId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      console.log(`🌐 GET /attendance/report/${assignmentId}`);
      const result = await this.attendanceService.getAttendanceReport(
        assignmentId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      console.log('✅ Reporte de asistencia obtenido exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener reporte de asistencia:', error);
      throw error;
    }
  }

  // ⭐ MARCAR ASISTENCIA AUTOMÁTICA (desde control de acceso)
  @Post('auto-mark')
  @Roles('Administrador',) // Sistema para llamadas internas
  async autoMarkAttendance(@Body() data: {
    profileId: number;
    entryTime: Date;
    accessRecordId?: number;
  }) {
    try {
      console.log('🌐 POST /attendance/auto-mark');
      const result = await this.attendanceService.autoMarkAttendance(
        data.profileId, 
        data.entryTime,
        data.accessRecordId
      );
      console.log('✅ Asistencia automática marcada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al marcar asistencia automática:', error);
      throw error;
    }
  }

  // ⭐ OBTENER DASHBOARD DEL INSTRUCTOR
  @Get('instructor-dashboard')
  @Roles('Instructor')
  async getInstructorDashboard(@Request() req: any) {
    try {
      console.log('🌐 GET /attendance/instructor-dashboard');
      const instructorId = req.user.id;
      const result = await this.attendanceService.getInstructorDashboardStats(instructorId);
      console.log('✅ Dashboard del instructor obtenido exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener dashboard del instructor:', error);
      throw error;
    }
  }

  // ⭐ OBTENER CLASES DE HOY PARA INSTRUCTOR
  @Get('today-classes')
  @Roles('Instructor')
  async getTodayClasses(@Request() req: any) {
    try {
      console.log('🌐 GET /attendance/today-classes');
      const instructorId = req.user.id;
      const result = await this.attendanceService.getInstructorTodayClasses(instructorId);
      console.log('✅ Clases de hoy obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener clases de hoy:', error);
      return [];
    }
  }

  // ⭐ OBTENER HORARIOS POR FECHA
  @Get('schedules-by-date')
  @Roles('Administrador', 'Instructor')
  async getSchedulesByDate(
    @Query('date') date: string,
    @Query('instructorId') instructorId?: number
  ) {
    try {
      console.log(`🌐 GET /attendance/schedules-by-date?date=${date}&instructorId=${instructorId}`);
      
      if (!date) {
        throw new Error('Fecha requerida');
      }

      const result = await this.attendanceService.getSchedulesByDate(date, instructorId);
      console.log('✅ Horarios por fecha obtenidos exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener horarios por fecha:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HORARIO POR ID
  @Get('schedule/:scheduleId/details')
  @Roles('Administrador', 'Instructor')
  async getScheduleById(@Param('scheduleId') scheduleId: number) {
    try {
      console.log(`🌐 GET /attendance/schedule/${scheduleId}/details`);
      const result = await this.attendanceService.getScheduleById(scheduleId);
      console.log('✅ Horario obtenido exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener horario:', error);
      throw error;
    }
  }

  // ⭐ CREAR HORARIO DE CLASE
  @Post('schedule')
  @Roles('Administrador', 'Instructor')
  async createClassSchedule(@Body() data: {
    assignmentId: number;
    date: string;
    startTime: string;
    endTime: string;
    classroom?: string;
    description?: string;
    lateToleranceMinutes?: number;
  }) {
    try {
      console.log('🌐 POST /attendance/schedule');
      
      // Convertir date string a formato correcto si es necesario
      const scheduleData = {
        ...data,
        date: (typeof data.date === 'object' && data.date !== null && 'toISOString' in data.date)
          ? (data.date as Date).toISOString().split('T')[0]
          : data.date.toString().split('T')[0]
      };

      const result = await this.attendanceService.createClassSchedule(scheduleData);
      console.log('✅ Horario de clase creado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al crear horario de clase:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HORARIOS POR ASIGNACIÓN
  @Get('assignment/:assignmentId/schedules')
  @Roles('Administrador', 'Instructor')
  async getSchedulesByAssignment(@Param('assignmentId') assignmentId: number) {
    try {
      console.log(`🌐 GET /attendance/assignment/${assignmentId}/schedules`);
      const result = await this.attendanceService.getSchedulesByAssignment(assignmentId);
      console.log('✅ Horarios por asignación obtenidos exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener horarios por asignación:', error);
      throw error;
    }
  }

  // ⭐ ENDPOINT DE SALUD DEL SERVICIO
  @Get('health')
  async healthCheck() {
    try {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Attendance Service',
        message: 'Servicio de asistencia funcionando correctamente'
      };
    } catch (error) {
      throw new Error('Servicio de asistencia no disponible');
    }
  }

  // ⭐ OBTENER RESUMEN DE ASISTENCIA PARA DASHBOARD
  @Get('summary')
  @Roles('Administrador')
  async getAttendanceSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('fichaId') fichaId?: number
  ) {
    try {
      console.log('🌐 GET /attendance/summary');
      
      // Por ahora retornar estructura básica
      // Implementar lógica completa según necesidades
      return {
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        message: 'Resumen de asistencia - Funcionalidad en desarrollo'
      };
    } catch (error) {
      console.error('❌ Error al obtener resumen de asistencia:', error);
      throw error;
    }
  }
}
