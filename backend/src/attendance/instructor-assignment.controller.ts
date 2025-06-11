// backend/src/attendance/instructor-assignment.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpException
} from '@nestjs/common';
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
    try {
      return await this.attendanceService.assignInstructorToFicha(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al asignar instructor a ficha',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  
  

  // ⭐ OBTENER FICHAS DE UN INSTRUCTOR AUTENTICADO
  @Get('my-fichas')
  @Roles('Instructor')
  async getMyFichas(@Request() req: any) {
    try {
      return await this.attendanceService.getInstructorFichas(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Error al obtener fichas del instructor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER FICHAS DE CUALQUIER INSTRUCTOR (Solo admin)
  @Get('instructor/:instructorId/fichas')
  @Roles('Administrador')
  async getInstructorFichas(@Param('instructorId', ParseIntPipe) instructorId: number) {
    try {
      return await this.attendanceService.getInstructorFichas(instructorId);
    } catch (error) {
      throw new HttpException(
        'Error al obtener fichas del instructor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER TODAS LAS ASIGNACIONES (Solo admin)
  @Get()
  @Roles('Administrador')
  async getAllAssignments() {
    try {
      return await this.attendanceService.getAllInstructorAssignments();
    } catch (error) {
      throw new HttpException(
        'Error al obtener todas las asignaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER UNA ASIGNACIÓN ESPECÍFICA
  @Get(':assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    try {
      const assignments = await this.attendanceService.getAllInstructorAssignments();
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        throw new HttpException('Asignación no encontrada', HttpStatus.NOT_FOUND);
      }
      
      return assignment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ACTUALIZAR UNA ASIGNACIÓN
  @Put(':assignmentId')
  @Roles('Administrador')
  async updateAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() data: {
      subject?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    try {
      // Aquí necesitarías implementar updateInstructorAssignment en el service
      // Por ahora retornamos un mensaje
      return {
        message: 'Funcionalidad de actualización pendiente de implementar',
        assignmentId,
        data
      };
    } catch (error) {
      throw new HttpException(
        'Error al actualizar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ELIMINAR/DESACTIVAR UNA ASIGNACIÓN
  @Delete(':assignmentId')
  @Roles('Administrador')
  async removeAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    try {
      return await this.attendanceService.removeInstructorAssignment(assignmentId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al eliminar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASIGNACIONES
  @Get('stats/overview')
  @Roles('Administrador')
  async getAssignmentStats() {
    try {
      const assignments = await this.attendanceService.getAllInstructorAssignments();
      
      const stats = {
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter(a => a.isActive).length,
        inactiveAssignments: assignments.filter(a => !a.isActive).length,
        instructorsWithAssignments: [...new Set(assignments.map(a => a.instructorId))].length,
        fichasWithInstructors: [...new Set(assignments.map(a => a.fichaId))].length
      };
      
      return stats;
    } catch (error) {
      throw new HttpException(
        'Error al obtener estadísticas de asignaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ VERIFICAR SI UN INSTRUCTOR ESTÁ ASIGNADO A UNA FICHA
  @Get('check/:instructorId/:fichaId')
  @Roles('Administrador', 'Instructor')
  async checkAssignment(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('fichaId', ParseIntPipe) fichaId: number
  ) {
    try {
      const assignments = await this.attendanceService.getInstructorFichas(instructorId);
      const isAssigned = assignments.some(a => a.fichaId === fichaId && a.isActive);
      
      return {
        isAssigned,
        instructorId,
        fichaId,
        assignment: isAssigned ? assignments.find(a => a.fichaId === fichaId && a.isActive) : null
      };
    } catch (error) {
      throw new HttpException(
        'Error al verificar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER INSTRUCTORES SIN ASIGNACIONES
  @Get('unassigned/instructors')
  @Roles('Administrador')
  async getUnassignedInstructors() {
    try {
      // Esta funcionalidad requeriría acceso al servicio de usuarios
      // Por ahora retornamos un mensaje
      return {
        message: 'Funcionalidad pendiente - requiere integración con UserService',
        note: 'Necesita obtener todos los instructores y filtrar los que no tienen asignaciones'
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener instructores sin asignaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER FICHAS SIN INSTRUCTORES
  @Get('unassigned/fichas')
  @Roles('Administrador')
  async getUnassignedFichas() {
    try {
      // Esta funcionalidad requeriría acceso al servicio de fichas
      // Por ahora retornamos un mensaje
      return {
        message: 'Funcionalidad pendiente - requiere integración con FichaService',
        note: 'Necesita obtener todas las fichas y filtrar las que no tienen instructores asignados'
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener fichas sin instructores',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ REACTIVAR UNA ASIGNACIÓN
  @Put(':assignmentId/reactivate')
  @Roles('Administrador')
  async reactivateAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    try {
      // Implementar reactivación en el service
      return {
        message: 'Funcionalidad de reactivación pendiente de implementar',
        assignmentId
      };
    } catch (error) {
      throw new HttpException(
        'Error al reactivar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER HISTORIAL DE ASIGNACIONES DE UN INSTRUCTOR
  @Get('instructor/:instructorId/history')
  @Roles('Administrador')
  async getInstructorAssignmentHistory(@Param('instructorId', ParseIntPipe) instructorId: number) {
    try {
      const assignments = await this.attendanceService.getAllInstructorAssignments();
      const instructorAssignments = assignments.filter(a => a.instructorId === instructorId);
      
      return {
        instructorId,
        totalAssignments: instructorAssignments.length,
        activeAssignments: instructorAssignments.filter(a => a.isActive).length,
        assignments: instructorAssignments.sort((a, b) => 
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        )
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener historial de asignaciones del instructor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER ASIGNACIONES DE UNA FICHA
  @Get('ficha/:fichaId/assignments')
  @Roles('Administrador')
  async getFichaAssignments(@Param('fichaId', ParseIntPipe) fichaId: number) {
    try {
      const assignments = await this.attendanceService.getAllInstructorAssignments();
      const fichaAssignments = assignments.filter(a => a.fichaId === fichaId);
      
      return {
        fichaId,
        totalAssignments: fichaAssignments.length,
        activeAssignments: fichaAssignments.filter(a => a.isActive).length,
        assignments: fichaAssignments.sort((a, b) => 
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        )
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener asignaciones de la ficha',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
