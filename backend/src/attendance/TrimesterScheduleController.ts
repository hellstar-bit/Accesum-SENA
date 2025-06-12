// backend/src/attendance/TrimesterScheduleController.ts
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

// ⭐ IMPORTAR TIPOS DESDE EL ARCHIVO COMPARTIDO
import { TrimesterScheduleItem, CreateTrimesterScheduleDto } from './types/attendance.types';

@Controller('trimester-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrimesterScheduleController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ⭐ USAR TIPO EXPLÍCITO DEL ARCHIVO COMPARTIDO
  @Get('ficha/:fichaId')
  @Roles('Administrador', 'Instructor')
  async getTrimesterSchedule(
    @Param('fichaId', ParseIntPipe) fichaId: number,
    @Query('trimester') trimester: string
  ): Promise<Record<string, TrimesterScheduleItem[]>> {
    try {
      console.log(`🌐 GET /trimester-schedules/ficha/${fichaId}?trimester=${trimester}`);
      const result = await this.attendanceService.getTrimesterSchedule(fichaId, trimester);
      console.log('✅ Horarios de trimestre obtenidos exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener horarios de trimestre:', error);
      // Retornar estructura vacía en lugar de error
      return {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };
    }
  }

  @Post()
  @Roles('Administrador', 'Instructor')
  async createTrimesterSchedule(@Body() data: CreateTrimesterScheduleDto) {
    try {
      console.log('🌐 POST /trimester-schedules');
      const result = await this.attendanceService.createTrimesterSchedule(data);
      console.log('✅ Horario de trimestre creado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al crear horario de trimestre:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles('Administrador', 'Instructor')
  async deleteSchedule(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`🌐 DELETE /trimester-schedules/${id}`);
      const result = await this.attendanceService.deleteTrimesterSchedule(id);
      console.log('✅ Horario de trimestre eliminado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al eliminar horario de trimestre:', error);
      throw error;
    }
  }
}
