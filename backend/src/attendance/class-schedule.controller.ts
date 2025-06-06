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
    date: string;
    startTime: string;
    endTime: string;
    classroom?: string;
    description?: string;
  }) {
    return await this.attendanceService.createClassSchedule({
      ...data,
      date: new Date(data.date)
    });
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
    return await this.attendanceService.getSchedulesByDate(date, instructorId);
  }

  // ⭐ OBTENER HORARIO ESPECÍFICO
  @Get(':id')
  @Roles('Administrador', 'Instructor')
  async getScheduleById(@Param('id') id: number) {
    return await this.attendanceService.getScheduleById(id);
  }
}