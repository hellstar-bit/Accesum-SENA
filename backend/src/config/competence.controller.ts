// backend/src/config/competence.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
      console.log('🌐 POST /competences');
      const result = await this.competenceService.createCompetence(data);
      console.log('✅ Competencia creada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al crear competencia:', error);
      throw error;
    }
  }

  @Get()
  @Roles('Administrador', 'Instructor')
  async getAllCompetences() {
    try {
      console.log('🌐 GET /competences');
      const result = await this.competenceService.getAllCompetences();
      console.log('✅ Competencias obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al obtener competencias:', error);
      throw error;
    }
  }
}
