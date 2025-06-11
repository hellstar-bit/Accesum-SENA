import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('typeId') typeId?: string,
    @Query('fichaId') fichaId?: string,
    @Query('regionalId') regionalId?: string,
    @Query('centerId') centerId?: string,
  ) {
    try {
      console.log('🌐 GET /users - Parámetros recibidos:', {
        page, limit, search, role, status, typeId, fichaId, regionalId, centerId,
      });

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

      const filters: any = {};
      
      if (search && search.trim()) filters.search = search.trim();
      if (role && role.trim()) filters.role = role.trim();
      if (status && (status === 'active' || status === 'inactive')) filters.status = status;
      if (typeId && !isNaN(Number(typeId))) filters.typeId = Number(typeId);
      if (fichaId && !isNaN(Number(fichaId))) filters.fichaId = Number(fichaId);
      if (regionalId && !isNaN(Number(regionalId))) filters.regionalId = Number(regionalId);
      if (centerId && !isNaN(Number(centerId))) filters.centerId = Number(centerId);

      console.log('🔍 Filtros procesados:', filters);

      const result = await this.usersService.findAll(pageNum, limitNum, filters);
      
      console.log('✅ Consulta exitosa, retornando resultados');
      return result;

    } catch (error) {
      console.error('❌ Error en GET /users:', error);
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor al consultar usuarios',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('fichas')
  @Roles('Administrador', 'Instructor')
  async getFichas() {
    try {
      console.log('🌐 GET /users/fichas');
      const result = await this.usersService.getFichas();
      console.log('✅ Fichas obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en GET /users/fichas:', error);
      return [];
    }
  }

  // ⭐ NUEVOS ENDPOINTS PARA HORARIOS POR TRIMESTRE
  @Get('instructors/with-competences')
  @Roles('Administrador', 'Instructor')
  async getInstructorsWithCompetences() {
    try {
      console.log('🌐 GET /users/instructors/with-competences');
      const instructors = await this.usersService.getInstructorsWithCompetences();
      console.log('✅ Instructores con competencias obtenidos:', instructors.length);
      return instructors;
    } catch (error) {
      console.error('❌ Error en instructors/with-competences:', error);
      throw new HttpException('Error al obtener instructores con competencias', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('fichas/with-competences')
  @Roles('Administrador', 'Instructor')
  async getFichasWithCompetences() {
    try {
      console.log('🌐 GET /users/fichas/with-competences');
      const fichas = await this.usersService.getFichasWithCompetences();
      console.log('✅ Fichas con competencias obtenidas:', fichas.length);
      return fichas;
    } catch (error) {
      console.error('❌ Error en fichas/with-competences:', error);
      throw new HttpException('Error al obtener fichas con competencias', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('competences')
  @Roles('Administrador', 'Instructor')
  async getAllCompetences() {
    try {
      console.log('🌐 GET /users/competences');
      const competences = await this.usersService.getAllCompetences();
      console.log('✅ Competencias obtenidas:', competences.length);
      return competences;
    } catch (error) {
      console.error('❌ Error en competences:', error);
      throw new HttpException('Error al obtener competencias', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getStats() {
    try {
      console.log('🌐 GET /users/stats');
      const result = await this.usersService.getStats();
      console.log('✅ Estadísticas obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en GET /users/stats:', error);
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al obtener estadísticas',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`🌐 GET /users/${id}`);
      const result = await this.usersService.findOne(id);
      console.log('✅ Usuario obtenido exitosamente');
      return result;
    } catch (error) {
      console.error(`❌ Error en GET /users/${id}:`, error);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        }, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al obtener usuario',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      console.log('🌐 POST /users');
      const result = await this.usersService.create(createUserDto);
      console.log('✅ Usuario creado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en POST /users:', error);
      
      if (error.message.includes('ya está en uso')) {
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
        }, HttpStatus.CONFLICT);
      }
      
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al crear usuario',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      console.log(`🌐 PATCH /users/${id}`);
      const result = await this.usersService.update(id, updateUserDto);
      console.log('✅ Usuario actualizado exitosamente');
      return result;
    } catch (error) {
      console.error(`❌ Error en PATCH /users/${id}:`, error);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        }, HttpStatus.NOT_FOUND);
      }
      
      if (error.message.includes('ya está en uso')) {
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
        }, HttpStatus.CONFLICT);
      }
      
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al actualizar usuario',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`🌐 DELETE /users/${id}`);
      const result = await this.usersService.remove(id);
      console.log('✅ Usuario eliminado exitosamente');
      return result;
    } catch (error) {
      console.error(`❌ Error en DELETE /users/${id}:`, error);
      
      if (error.message.includes('no encontrado')) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        }, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al eliminar usuario',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
