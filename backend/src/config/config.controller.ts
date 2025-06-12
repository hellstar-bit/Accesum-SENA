// backend/src/config/config.controller.ts - CON ENDPOINTS FALTANTES
import { Controller, Get, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConfigService } from './config.service';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // ✅ OBTENER TODAS LAS FICHAS
  @Get('fichas')
  @Roles('Administrador', 'Instructor')
  async getAllFichas() {
    try {
      console.log('🌐 GET /config/fichas');
      const result = await this.configService.getAllFichas();
      console.log(`✅ ${result.length} fichas obtenidas exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener fichas:', error);
      throw error;
    }
  }

  // ✅ OBTENER FICHA POR ID
  @Get('fichas/:id')
  @Roles('Administrador', 'Instructor')
  async getFichaById(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`🌐 GET /config/fichas/${id}`);
      const result = await this.configService.getFichaById(id);
      
      if (!result) {
        return {
          success: false,
          message: 'Ficha no encontrada'
        };
      }
      
      console.log('✅ Ficha obtenida exitosamente');
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Error al obtener ficha por ID:', error);
      throw error;
    }
  }

  // ✅ OBTENER TODOS LOS PROGRAMAS
  @Get('programs')
  @Roles('Administrador', 'Instructor')
  async getAllPrograms() {
    try {
      console.log('🌐 GET /config/programs');
      const result = await this.configService.getAllPrograms();
      console.log(`✅ ${result.length} programas obtenidos exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener programas:', error);
      throw error;
    }
  }

  // ✅ OBTENER TODAS LAS COORDINACIONES
  @Get('coordinations')
  @Roles('Administrador')
  async getAllCoordinations() {
    try {
      console.log('🌐 GET /config/coordinations');
      const result = await this.configService.getAllCoordinations();
      console.log(`✅ ${result.length} coordinaciones obtenidas exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener coordinaciones:', error);
      throw error;
    }
  }

  // ✅ OBTENER TODOS LOS CENTROS
  @Get('centers')
  @Roles('Administrador')
  async getAllCenters() {
    try {
      console.log('🌐 GET /config/centers');
      const result = await this.configService.getAllCenters();
      console.log(`✅ ${result.length} centros obtenidos exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener centros:', error);
      throw error;
    }
  }

  // ✅ OBTENER TODAS LAS REGIONALES
  @Get('regionals')
  @Roles('Administrador')
  async getAllRegionals() {
    try {
      console.log('🌐 GET /config/regionals');
      const result = await this.configService.getAllRegionals();
      console.log(`✅ ${result.length} regionales obtenidas exitosamente`);
      
      return {
        success: true,
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Error al obtener regionales:', error);
      throw error;
    }
  }

  // ✅ CREAR NUEVA FICHA
  @Post('fichas')
  @Roles('Administrador')
  async createFicha(@Body() data: {
    code: string;
    name: string;
    programId: number;
    startDate?: string;
    endDate?: string;
    reportDate?: string;
    status?: string;
  }) {
    try {
      console.log('🌐 POST /config/fichas', data);
      const result = await this.configService.createFicha(data);
      console.log('✅ Ficha creada exitosamente');
      
      return {
        success: true,
        data: result,
        message: 'Ficha creada exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al crear ficha:', error);
      throw error;
    }
  }

  // ✅ CREAR NUEVO PROGRAMA
  @Post('programs')
  @Roles('Administrador')
  async createProgram(@Body() data: {
    code: string;
    name: string;
    coordinationId: number;
    description?: string;
    totalHours?: number;
    status?: string;
  }) {
    try {
      console.log('🌐 POST /config/programs', data);
      const result = await this.configService.createProgram(data);
      console.log('✅ Programa creado exitosamente');
      
      return {
        success: true,
        data: result,
        message: 'Programa creado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al crear programa:', error);
      throw error;
    }
  }

  // ✅ OBTENER CONFIGURACIÓN GENERAL DEL SISTEMA
  @Get('system-info')
  @Roles('Administrador', 'Instructor')
  async getSystemInfo() {
    try {
      console.log('🌐 GET /config/system-info');
      
      const [fichas, programs, competences] = await Promise.all([
        this.configService.getAllFichas(),
        this.configService.getAllPrograms(),
        this.configService.getAllCompetences() // Asumir que este método existe
      ]);

      const systemInfo = {
        totalFichas: fichas.length,
        activeFichas: fichas.filter(f => f.isActive).length,
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.status === 'ACTIVO').length,
        totalCompetences: competences.length,
        activeCompetences: competences.filter(c => c.isActive).length,
        lastUpdate: new Date().toISOString()
      };

      console.log('✅ Información del sistema obtenida');
      return {
        success: true,
        data: systemInfo
      };
    } catch (error) {
      console.error('❌ Error al obtener información del sistema:', error);
      return {
        success: true,
        data: {
          totalFichas: 0,
          activeFichas: 0,
          totalPrograms: 0,
          activePrograms: 0,
          totalCompetences: 0,
          activeCompetences: 0,
          lastUpdate: new Date().toISOString(),
          error: 'Error al cargar datos'
        }
      };
    }
  }
}