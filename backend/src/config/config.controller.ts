// backend/src/config/config.controller.ts - CORREGIDO
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES } from '../auth/constants/roles.constant'; // ✅ Importar constantes
import { ConfigService } from './config.service';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN) // ✅ Usar constante en lugar de string
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // ⭐ REGIONALES
  @Get('regionales')
  async getRegionales() {
    return await this.configService.getRegionales();
  }

  @Post('regionales')
  async createRegional(@Body() data: { name: string }) {
    return await this.configService.createRegional(data);
  }

  @Put('regionales/:id')
  async updateRegional(
    @Param('id') id: number,
    @Body() data: { name: string }
  ) {
    return await this.configService.updateRegional(id, data);
  }

  @Delete('regionales/:id')
  async deleteRegional(@Param('id') id: number) {
    return await this.configService.deleteRegional(id);
  }

  // ⭐ CENTROS
  @Get('centers')
  async getCenters() {
    return await this.configService.getCenters();
  }

  @Post('centers')
  async createCenter(@Body() data: { name: string; regionalId: number }) {
    return await this.configService.createCenter(data);
  }

  @Put('centers/:id')
  async updateCenter(
    @Param('id') id: number,
    @Body() data: { name?: string; regionalId?: number }
  ) {
    return await this.configService.updateCenter(id, data);
  }

  @Delete('centers/:id')
  async deleteCenter(@Param('id') id: number) {
    return await this.configService.deleteCenter(id);
  }

  // ⭐ COORDINACIONES
  @Get('coordinations')
  async getCoordinations() {
    return await this.configService.getCoordinations();
  }

  @Get('centers/:centerId/coordinations')
  async getCoordinationsByCenter(@Param('centerId') centerId: number) {
    return await this.configService.getCoordinationsByCenter(centerId);
  }

  @Post('coordinations')
  async createCoordination(@Body() data: { name: string; centerId: number }) {
    return await this.configService.createCoordination(data);
  }

  @Put('coordinations/:id')
  async updateCoordination(
    @Param('id') id: number,
    @Body() data: { name?: string; centerId?: number }
  ) {
    return await this.configService.updateCoordination(id, data);
  }

  @Delete('coordinations/:id')
  async deleteCoordination(@Param('id') id: number) {
    return await this.configService.deleteCoordination(id);
  }

  // ⭐ PROGRAMAS
  @Get('programs')
  async getPrograms() {
    return await this.configService.getPrograms();
  }

  @Post('programs')
  async createProgram(@Body() data: { name: string; coordinationId: number }) {
    return await this.configService.createProgram(data);
  }

  @Put('programs/:id')
  async updateProgram(
    @Param('id') id: number,
    @Body() data: { name?: string; coordinationId?: number }
  ) {
    return await this.configService.updateProgram(id, data);
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: number) {
    return await this.configService.deleteProgram(id);
  }

  // ⭐ FICHAS
  @Get('fichas')
  async getFichas() {
    return await this.configService.getFichas();
  }

  @Post('fichas')
  async createFicha(@Body() data: { 
    code: string; 
    name: string; 
    programId: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await this.configService.createFicha(data);
  }

  @Put('fichas/:id')
  async updateFicha(
    @Param('id') id: number,
    @Body() data: { 
      code?: string; 
      name?: string; 
      programId?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    return await this.configService.updateFicha(id, data);
  }

  @Delete('fichas/:id')
  async deleteFicha(@Param('id') id: number) {
    return await this.configService.deleteFicha(id);
  }

  // ⭐ ROLES
  @Get('roles')
  async getRoles() {
    return await this.configService.getRoles();
  }

  @Post('roles')
  async createRole(@Body() data: { name: string; description?: string }) {
    return await this.configService.createRole(data);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: number,
    @Body() data: { name?: string; description?: string }
  ) {
    return await this.configService.updateRole(id, data);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: number) {
    return await this.configService.deleteRole(id);
  }

  // ⭐ TIPOS DE PERSONAL
  @Get('personnel-types')
  async getPersonnelTypes() {
    return await this.configService.getPersonnelTypes();
  }

  @Post('personnel-types')
  async createPersonnelType(@Body() data: { name: string }) {
    return await this.configService.createPersonnelType(data);
  }

  @Put('personnel-types/:id')
  async updatePersonnelType(
    @Param('id') id: number,
    @Body() data: { name: string }
  ) {
    return await this.configService.updatePersonnelType(id, data);
  }

  @Delete('personnel-types/:id')
  async deletePersonnelType(@Param('id') id: number) {
    return await this.configService.deletePersonnelType(id);
  }

  // ⭐ JERARQUÍA COMPLETA
  @Get('hierarchy')
  async getHierarchy() {
    return await this.configService.getHierarchy();
  }
}