// backend/src/config/competence.controller.ts
import { Controller, Get, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompetenceService } from './competence.service';

@Controller('competences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompetenceController {
  constructor(private readonly competenceService: CompetenceService) {}

  @Post()
  @Roles('Administrador', 'Instructor')
  async createCompetence(@Body() data: {
    code: string;
    name: string;
    description?: string;
    hours: number;
    programId: number;
    instructorIds: number[];
  }) {
    try {
      console.log('🌐 POST /competences - Datos recibidos:', JSON.stringify(data, null, 2));
      
      // Validar datos requeridos
      if (!data.code || !data.name || !data.programId) {
        throw new Error('Faltan campos requeridos: code, name, programId');
      }

      const result = await this.competenceService.createCompetence(data);

      if (!result) {
        throw new Error('No se pudo crear la competencia');
      }
      
      console.log('✅ Competencia creada exitosamente:', {
        id: result.id,
        code: result.code,
        name: result.name,
        programId: result.programId
      });
      
      return {
        success: true,
        data: result,
        message: 'Competencia creada exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al crear competencia:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  @Get()
  @Roles('Administrador', 'Instructor')
  async getAllCompetences() {
    try {
      console.log('🌐 GET /competences');
      const result = await this.competenceService.getAllCompetences();
      
      console.log(`✅ ${result.length} competencias obtenidas exitosamente`);
      
      // Log adicional para debugging
      result.forEach(comp => {
        console.log(`  📝 ${comp.code}: ${comp.name} (ID: ${comp.id}, Programa: ${comp.programId})`);
      });
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener competencias:', error.message);
      throw error;
    }
  }

  // ✅ NUEVO ENDPOINT para debugging
  @Get('debug/:id')
  @Roles('Administrador', 'Instructor')
  async debugCompetence(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`🔍 DEBUG - Competencia ID: ${id}`);
      const result = await this.competenceService.getCompetenceById(id);
      
      if (!result) {
        return { success: false, message: 'Competencia no encontrada' };
      }
      
      console.log('🔍 Debug info:', {
        id: result.id,
        code: result.code,
        name: result.name,
        programId: result.programId,
        isActive: result.isActive,
        instructorsCount: result.instructors?.length || 0,
        fichaAssignmentsCount: result.fichaAssignments?.length || 0
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error en debug:', error);
      throw error;
    }
  }

  // ✅ NUEVO ENDPOINT para obtener competencias por programa
  @Get('program/:programId')
  @Roles('Administrador', 'Instructor')
  async getCompetencesByProgram(@Param('programId', ParseIntPipe) programId: number) {
    try {
      console.log(`🌐 GET /competences/program/${programId}`);
      const result = await this.competenceService.getAllCompetences();
      
      // Filtrar por programa
      const filtered = result.filter(comp => comp.programId === programId);
      
      console.log(`✅ ${filtered.length} competencias encontradas para programa ${programId}`);
      
      return {
        success: true,
        data: filtered,
        count: filtered.length
      };
    } catch (error) {
      console.error('❌ Error al obtener competencias por programa:', error);
      throw error;
    }
  }
}