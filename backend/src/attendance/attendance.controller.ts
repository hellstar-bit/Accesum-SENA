// backend/src/attendance/attendance.controller.ts - COMPLETO
import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

interface AttendanceUpdateResult {
  id: number;
  attendanceId: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  markedAt: string | null;
  manuallyMarkedAt: string | null;
  isManual: boolean;
  notes: string | undefined;
  excuseReason: string | undefined;
  markedBy: number | undefined;
  learner: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
  } | null;
}



@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('debug/ficha/:fichaId')
  @Roles('Administrador', 'Instructor')
  async debugFicha(@Param('fichaId') fichaId: number) {
    try {
      const debugData = await this.attendanceService.debugFichaData(fichaId);
      
      return {
        success: true,
        fichaId,
        debugData,
        message: 'Diagnóstico completado - revisar logs del servidor'
      };
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error en diagnóstico'
      };
    }
  }

  // ⭐ OBTENER MIS CLASES Y ASISTENCIA (INSTRUCTOR)
  @Get('my-classes')
  @Roles('Instructor')
  async getMyClassesAttendance(
    @Query('date') date?: string,
    @Request() req?: any
  ) {
    try {
      
      const instructorId = req.user.id;
      
      const result = await this.attendanceService.getMyClassesAttendance(
        instructorId,
        date
      );
      
      return result;
    } catch (error) {
      console.error('❌ Error al obtener clases del instructor:', error);
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
  // AGREGAR ESTOS ENDPOINTS AL AttendanceController, DESPUÉS DEL MÉTODO markAttendance

// ⭐ ACTUALIZAR ASISTENCIA INDIVIDUAL
@Post('update-attendance')
@Roles('Administrador', 'Instructor')
async updateAttendance(
  @Body() data: {
    attendanceId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA';
    notes?: string;
    excuseReason?: string;
  },
  @Request() req?: any
): Promise<any> {
  try {
    console.log('🌐 POST /attendance/update-attendance');
    const instructorId = req.user.id;
    const result = await this.attendanceService.updateAttendanceRecord(
      data.attendanceId,
      data.status,
      instructorId,
      data.notes,
      data.excuseReason
    );
    console.log('✅ Asistencia actualizada exitosamente');
    return {
      success: true,
      data: result,
      message: 'Asistencia actualizada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al actualizar asistencia:', error);
    throw error;
  }
}

// ⭐ MÉTODO CORREGIDO CON LA INTERFAZ
@Post('bulk-update')
@Roles('Administrador', 'Instructor')
async bulkUpdateAttendance(@Body() data: {
  updates: Array<{
    attendanceId: number;
    status: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA';
    notes?: string;
    excuseReason?: string;
  }>;
}, @Request() req?: any) {
  try {
    console.log('🌐 POST /attendance/bulk-update');
    const instructorId = req.user.id;
    
    // ⭐ USAR LA INTERFAZ
    const results: AttendanceUpdateResult[] = [];
    
    for (const update of data.updates) {
      const result = await this.attendanceService.updateAttendanceRecord(
        update.attendanceId,
        update.status,
        instructorId,
        update.notes,
        update.excuseReason
      );
      results.push(result);
    }
    
    console.log(`✅ ${results.length} registros actualizados exitosamente`);
    return {
      success: true,
      data: results,
      message: `${results.length} registros actualizados exitosamente`
    };
  } catch (error) {
    console.error('❌ Error en actualización masiva:', error);
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
@Roles('Administrador', 'Instructor', 'Aprendiz') // ⭐ AGREGAR Aprendiz para permitir auto-marcado
async autoMarkAttendance(@Body() data: {
  profileId: number;
  entryTime: Date | string; // ⭐ PERMITIR string también
  accessRecordId?: number;
}) {
  try {
    console.log('🌐 POST /attendance/auto-mark');
    console.log('📋 Datos recibidos:', {
      profileId: data.profileId,
      entryTime: data.entryTime,
      accessRecordId: data.accessRecordId
    });
    
    // ⭐ CONVERTIR entryTime A Date SI ES STRING
    const entryTime = typeof data.entryTime === 'string' 
      ? new Date(data.entryTime) 
      : data.entryTime;
    
    console.log('📋 Hora de entrada procesada:', entryTime.toISOString());
    
    const result = await this.attendanceService.autoMarkAttendance(
      data.profileId, 
      entryTime,
      data.accessRecordId
    );
    
    console.log('✅ Resultado del marcado automático:', {
      success: result.success,
      message: result.message,
      recordsCount: result.records.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error al marcar asistencia automática:', error);
    return {
      success: false,
      message: 'Error interno al marcar asistencia automática',
      profileId: data.profileId,
      entryTime: data.entryTime,
      records: [],
      error: error.message
    };
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
