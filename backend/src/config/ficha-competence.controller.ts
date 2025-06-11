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
      console.log('✅ Competencias de ficha obtenidas exitosamente');
      return result;
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
      const result = await this.fichaCompetenceService.getAvailableCompetences(fichaId);
      console.log('✅ Competencias disponibles obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener competencias disponibles:', error);
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
      console.log('🌐 POST /ficha-competences/assign');
      const result = await this.fichaCompetenceService.assignCompetenceToFicha(data.fichaId, data.competenceId);
      console.log('✅ Competencia asignada a ficha exitosamente');
      return result;
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
      return result;
    } catch (error) {
      console.error('❌ Error al remover competencia de ficha:', error);
      throw error;
    }
  }
}
