// backend/src/attendance/class-schedule.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('class-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassScheduleController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ⭐ CREAR HORARIO DE CLASE (Admin e Instructores)
  @Post()
  @Roles('Administrador', 'Instructor')
  async createSchedule(@Body() data: {
  assignmentId: number;
  date: Date | string; // Permitir Date o string
  startTime: string;
  endTime: string;
  classroom?: string;
  description?: string;
  lateToleranceMinutes?: number;
}) {
  try {
    // ⭐ CONVERTIR Date A STRING ANTES DE PASAR AL SERVICIO
    let formattedDate: string;
    if (data.date instanceof Date) {
      formattedDate = data.date.toISOString().split('T')[0];
    } else if (typeof data.date === 'string') {
      formattedDate = data.date.split('T')[0];
    } else {
      throw new Error('Invalid date format');
    }

    const scheduleData = {
      ...data,
      date: formattedDate
    };

    return await this.attendanceService.createClassSchedule(scheduleData);
  } catch (error) {
    throw error;
  }
}

  // ⭐ OBTENER HORARIOS DE UNA ASIGNACIÓN
  @Get('assignment/:assignmentId')
  @Roles('Administrador', 'Instructor')
  async getSchedulesByAssignment(@Param('assignmentId') assignmentId: number) {
    return await this.attendanceService.getSchedulesByAssignment(assignmentId);
  }

  // ⭐ OBTENER MIS CLASES DE HOY (Para instructor)
  @Get('my-today')
  @Roles('Instructor')
  async getMyTodayClasses(@Request() req: any) {
    return await this.attendanceService.getInstructorTodayClasses(req.user.id);
  }

  // ⭐ OBTENER HORARIOS POR FECHA
  @Get('date/:date')
  @Roles('Administrador', 'Instructor')
  async getSchedulesByDate(
    @Param('date') date: string,
    @Query('instructorId') instructorId?: number
  ) {
    // Asegurarse de pasar la fecha como string
    return await this.attendanceService.getSchedulesByDate(date, instructorId);
  }

  // ⭐ OBTENER HORARIO ESPECÍFICO
  @Get(':id')
  @Roles('Administrador', 'Instructor')
  async getScheduleById(@Param('id') id: number) {
    return await this.attendanceService.getScheduleById(id);
  }
}