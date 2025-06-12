// backend/src/config/ficha-competence.controller.ts
import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FichaCompetenceService } from './ficha-competence.service';

@Controller('ficha-competences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FichaCompetenceController {
  constructor(private readonly fichaCompetenceService: FichaCompetenceService) {}

  @Get('ficha/:fichaId')
  @Roles('Administrador', 'Instructor')
  async getFichaCompetences(@Param('fichaId', ParseIntPipe) fichaId: number) {
    try {
      console.log(`🌐 GET /ficha-competences/ficha/${fichaId}`);
      const result = await this.fichaCompetenceService.getFichaCompetences(fichaId);
      console.log(`✅ ${result.length} competencias de ficha obtenidas exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener competencias de ficha:', error);
      throw error;
    }
  }

  @Get('available/:fichaId')
  @Roles('Administrador', 'Instructor')
  async getAvailableCompetences(@Param('fichaId', ParseIntPipe) fichaId: number) {
    try {
      console.log(`🌐 GET /ficha-competences/available/${fichaId}`);
      console.log(`🔍 INICIANDO DEBUG AUTOMÁTICO...`);
      
      // Ejecutar debug primero
      const debugInfo = await this.fichaCompetenceService.debugFichaCompetences(fichaId);
      console.log('🔍 Debug ejecutado exitosamente');
      
      // Luego obtener las competencias disponibles
      const result = await this.fichaCompetenceService.getAvailableCompetences(fichaId);
      console.log(`✅ ${result.length} competencias disponibles obtenidas exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length,
        debug: debugInfo // Incluir info de debug en la respuesta
      };
    } catch (error) {
      console.error('❌ Error al obtener competencias disponibles:', error);
      
      // Ejecutar debug en caso de error también
      try {
        const debugInfo = await this.fichaCompetenceService.debugFichaCompetences(fichaId);
        console.log('🔍 Debug de error:', debugInfo);
      } catch (debugError) {
        console.error('❌ Error en debug:', debugError);
      }
      
      throw error;
    }
  }

  @Post('assign')
  @Roles('Administrador')
  async assignCompetenceToFicha(@Body() data: {
    fichaId: number;
    competenceId: number;
  }) {
    try {
      console.log('🌐 POST /ficha-competences/assign', data);
      
      if (!data.fichaId || !data.competenceId) {
        throw new Error('fichaId y competenceId son requeridos');
      }
      
      const result = await this.fichaCompetenceService.assignCompetenceToFicha(data.fichaId, data.competenceId);
      console.log('✅ Competencia asignada a ficha exitosamente');
      
      return {
        success: true,
        data: result,
        message: 'Competencia asignada exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al asignar competencia a ficha:', error);
      throw error;
    }
  }

  @Delete('remove/:fichaId/:competenceId')
  @Roles('Administrador')
  async removeCompetenceFromFicha(
    @Param('fichaId', ParseIntPipe) fichaId: number,
    @Param('competenceId', ParseIntPipe) competenceId: number
  ) {
    try {
      console.log(`🌐 DELETE /ficha-competences/remove/${fichaId}/${competenceId}`);
      const result = await this.fichaCompetenceService.removeCompetenceFromFicha(fichaId, competenceId);
      console.log('✅ Competencia removida de ficha exitosamente');
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error al remover competencia de ficha:', error);
      throw error;
    }
  }

  // ✅ ENDPOINT DE DEBUG INDEPENDIENTE
  @Get('debug/:fichaId')
  @Roles('Administrador', 'Instructor')
  async debugFichaCompetences(@Param('fichaId', ParseIntPipe) fichaId: number) {
    try {
      console.log(`🔍 DEBUG /ficha-competences/debug/${fichaId}`);
      const result = await this.fichaCompetenceService.debugFichaCompetences(fichaId);
      
      return {
        success: true,
        data: result,
        message: 'Debug info obtenida exitosamente'
      };
    } catch (error) {
      console.error('❌ Error en debug:', error);
      throw error;
    }
  }

  // ✅ ENDPOINT PARA OBTENER TODAS LAS COMPETENCIAS (para debugging)
  @Get('all-competences')
  @Roles('Administrador', 'Instructor')
  async getAllCompetences() {
    try {
      console.log('🌐 GET /ficha-competences/all-competences');
      
      // Usar el servicio de competencias directamente
      const competenceService = this.fichaCompetenceService['competenceRepository'];
      const allCompetences = await competenceService.find({
        where: { isActive: true },
        relations: ['program'],
        order: { code: 'ASC' }
      });
      
      console.log(`✅ ${allCompetences.length} competencias totales encontradas`);
      
      // Agrupar por programa
      const byProgram = allCompetences.reduce((acc, comp) => {
        const programId = comp.programId;
        const programName = comp.program?.name || 'Sin programa';
        
        if (!acc[programId]) {
          acc[programId] = {
            programId,
            programName,
            competences: []
          };
        }
        
        acc[programId].competences.push({
          id: comp.id,
          code: comp.code,
          name: comp.name,
          hours: comp.hours
        });
        
        return acc;
      }, {});
      
      return {
        success: true,
        data: {
          total: allCompetences.length,
          byProgram: Object.values(byProgram)
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener todas las competencias:', error);
      throw error;
    }
  }
}