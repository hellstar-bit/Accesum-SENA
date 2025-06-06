// instructor-assignment.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('instructor-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorAssignmentController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ⭐ ASIGNAR INSTRUCTOR A FICHA (Solo administradores)
  @Post()
  @Roles('Administrador')
  async assignInstructor(@Body() data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }) {
    return await this.attendanceService.assignInstructorToFicha(data);
  }

  // ⭐ OBTENER FICHAS DE UN INSTRUCTOR
  @Get('my-fichas')
  @Roles('Instructor')
  async getMyFichas(@Request() req: any) {
    return await this.attendanceService.getInstructorFichas(req.user.id);
  }

  // ⭐ OBTENER FICHAS DE CUALQUIER INSTRUCTOR (Solo admin)
  @Get('instructor/:instructorId/fichas')
  @Roles('Administrador')
  async getInstructorFichas(@Param('instructorId') instructorId: number) {
    return await this.attendanceService.getInstructorFichas(instructorId);
  }
}