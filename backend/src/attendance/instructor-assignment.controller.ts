// backend/src/attendance/instructor-assignment.controller.ts - COMPLETO
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
  HttpException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

// ⭐ IMPORTAR TIPOS DESDE EL ARCHIVO COMPARTIDO
import { 
  InstructorFicha, 
  InstructorAssignment,
  CreateInstructorAssignmentDto 
} from './types/attendance.types';

@Controller('instructor-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorAssignmentController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ⭐ ASIGNAR INSTRUCTOR A FICHA (Solo administradores)
  @Post()
  @Roles('Administrador')
  async assignInstructor(@Body() data: CreateInstructorAssignmentDto): Promise<InstructorAssignment> {
    try {
      console.log('🌐 POST /instructor-assignments');
      
      // Validaciones básicas
      if (!data.instructorId || !data.fichaId || !data.subject) {
        throw new BadRequestException('instructorId, fichaId y subject son requeridos');
      }

      const result = await this.attendanceService.assignInstructorToFicha(data);
      console.log('✅ Instructor asignado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al asignar instructor:', error);
      throw new HttpException(
        error.message || 'Error al asignar instructor a ficha',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ⭐ OBTENER TODAS LAS ASIGNACIONES (Solo admin)
  @Get()
  @Roles('Administrador')
  async getAllAssignments(): Promise<InstructorAssignment[]> {
    try {
      console.log('🌐 GET /instructor-assignments');
      const result = await this.attendanceService.getAllInstructorAssignments();
      console.log('✅ Todas las asignaciones obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener todas las asignaciones:', error);
      throw new HttpException(
        'Error al obtener todas las asignaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER FICHAS DE UN INSTRUCTOR AUTENTICADO
  @Get('my-fichas')
  @Roles('Instructor')
  async getMyFichas(@Request() req: any): Promise<InstructorFicha[]> {
    try {
      console.log('🌐 GET /instructor-assignments/my-fichas');
      const instructorId = req.user.id;
      const result = await this.attendanceService.getInstructorFichas(instructorId);
      console.log('✅ Fichas del instructor obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener fichas del instructor:', error);
      throw new HttpException(
        'Error al obtener fichas del instructor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER FICHAS DE CUALQUIER INSTRUCTOR (Solo admin)
  @Get('instructor/:instructorId/fichas')
  @Roles('Administrador')
  async getInstructorFichas(@Param('instructorId', ParseIntPipe) instructorId: number): Promise<InstructorFicha[]> {
    try {
      console.log(`🌐 GET /instructor-assignments/instructor/${instructorId}/fichas`);
      
      if (instructorId <= 0) {
        throw new BadRequestException('ID de instructor inválido');
      }

      const result = await this.attendanceService.getInstructorFichas(instructorId);
      console.log('✅ Fichas del instructor obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener fichas del instructor:', error);
      throw new HttpException(
        'Error al obtener fichas del instructor',
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
  ): Promise<{
    isAssigned: boolean;
    instructorId: number;
    fichaId: number;
    assignment: InstructorFicha | null;
  }> {
    try {
      console.log(`🌐 GET /instructor-assignments/check/${instructorId}/${fichaId}`);
      
      if (instructorId <= 0 || fichaId <= 0) {
        throw new BadRequestException('IDs de instructor y ficha deben ser válidos');
      }

      const assignments = await this.attendanceService.getInstructorFichas(instructorId);
      const assignment = assignments.find(a => a.fichaId === fichaId && a.isActive);
      
      const result = {
        isAssigned: !!assignment,
        instructorId,
        fichaId,
        assignment: assignment || null
      };

      console.log('✅ Verificación de asignación completada');
      return result;
    } catch (error) {
      console.error('❌ Error al verificar la asignación:', error);
      throw new HttpException(
        'Error al verificar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER ASIGNACIÓN POR ID
  @Get(':assignmentId')
  @Roles('Administrador', 'Instructor')
  async getAssignmentById(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    try {
      console.log(`🌐 GET /instructor-assignments/${assignmentId}`);
      
      if (assignmentId <= 0) {
        throw new BadRequestException('ID de asignación inválido');
      }

      // Por ahora retornar mensaje, implementar según necesidades
      return {
        message: 'Obtener asignación por ID - Funcionalidad pendiente',
        assignmentId
      };
    } catch (error) {
      console.error('❌ Error al obtener asignación:', error);
      throw new HttpException(
        'Error al obtener la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ACTUALIZAR ASIGNACIÓN
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
      console.log(`🌐 PUT /instructor-assignments/${assignmentId}`);
      
      if (assignmentId <= 0) {
        throw new BadRequestException('ID de asignación inválido');
      }

      if (!data.subject && !data.description && data.isActive === undefined) {
        throw new BadRequestException('Al menos un campo debe ser proporcionado para actualizar');
      }

      // Por ahora retornar mensaje, implementar según necesidades
      return {
        message: 'Actualizar asignación - Funcionalidad pendiente',
        assignmentId,
        data
      };
    } catch (error) {
      console.error('❌ Error al actualizar asignación:', error);
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
      console.log(`🌐 DELETE /instructor-assignments/${assignmentId}`);
      
      if (assignmentId <= 0) {
        throw new BadRequestException('ID de asignación inválido');
      }

      const result = await this.attendanceService.removeInstructorAssignment(assignmentId);
      console.log('✅ Asignación eliminada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al eliminar asignación:', error);
      throw new HttpException(
        error.message || 'Error al eliminar la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE ASIGNACIONES
  @Get('stats/summary')
  @Roles('Administrador')
  async getAssignmentStats() {
    try {
      console.log('🌐 GET /instructor-assignments/stats/summary');
      
      const allAssignments = await this.attendanceService.getAllInstructorAssignments();
      
      const stats = {
        totalAssignments: allAssignments.length,
        activeAssignments: allAssignments.filter(a => a.isActive).length,
        inactiveAssignments: allAssignments.filter(a => !a.isActive).length,
        uniqueInstructors: new Set(allAssignments.map(a => a.instructorId)).size,
        uniqueFichas: new Set(allAssignments.map(a => a.fichaId)).size,
        assignmentsByStatus: {
          active: allAssignments.filter(a => a.isActive).length,
          inactive: allAssignments.filter(a => !a.isActive).length
        }
      };

      console.log('✅ Estadísticas de asignaciones obtenidas');
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw new HttpException(
        'Error al obtener estadísticas de asignaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ BUSCAR ASIGNACIONES POR FICHA
  @Get('ficha/:fichaId/instructors')
  @Roles('Administrador')
  async getInstructorsByFicha(@Param('fichaId', ParseIntPipe) fichaId: number) {
    try {
      console.log(`🌐 GET /instructor-assignments/ficha/${fichaId}/instructors`);
      
      if (fichaId <= 0) {
        throw new BadRequestException('ID de ficha inválido');
      }

      const allAssignments = await this.attendanceService.getAllInstructorAssignments();
      const fichaAssignments = allAssignments.filter(a => a.fichaId === fichaId && a.isActive);

      console.log('✅ Instructores de la ficha obtenidos');
      return {
        fichaId,
        totalInstructors: fichaAssignments.length,
        instructors: fichaAssignments.map(assignment => ({
          assignmentId: assignment.id,
          instructorId: assignment.instructorId,
          instructor: assignment.instructor,
          subject: assignment.subject,
          description: assignment.description,
          assignedAt: assignment.assignedAt
        }))
      };
    } catch (error) {
      console.error('❌ Error al obtener instructores de la ficha:', error);
      throw new HttpException(
        'Error al obtener instructores de la ficha',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ACTIVAR/DESACTIVAR ASIGNACIÓN
  @Put(':assignmentId/toggle-status')
  @Roles('Administrador')
  async toggleAssignmentStatus(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    try {
      console.log(`🌐 PUT /instructor-assignments/${assignmentId}/toggle-status`);
      
      if (assignmentId <= 0) {
        throw new BadRequestException('ID de asignación inválido');
      }

      // Por ahora retornar mensaje, implementar según necesidades
      return {
        message: 'Cambiar estado de asignación - Funcionalidad pendiente',
        assignmentId
      };
    } catch (error) {
      console.error('❌ Error al cambiar estado de asignación:', error);
      throw new HttpException(
        'Error al cambiar estado de la asignación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ENDPOINT DE SALUD DEL CONTROLADOR
  @Get('health/check')
  async healthCheck() {
    try {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        controller: 'InstructorAssignmentController',
        message: 'Controlador de asignaciones funcionando correctamente'
      };
    } catch (error) {
      throw new HttpException(
        'Controlador de asignaciones no disponible',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
