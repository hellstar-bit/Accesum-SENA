// backend/src/users/users.controller.ts - VERSIÓN BÁSICA Y ROBUSTA
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

@Controller('users')
@UseGuards(JwtAuthGuard)
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
        page,
        limit,
        search,
        role,
        status,
        typeId,
        fichaId,
        regionalId,
        centerId,
      });

      // Validar y limpiar parámetros básicos
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Reducido a máximo 50

      // Construir filtros solo con valores válidos
      const filters: any = {};
      
      if (search && search.trim()) {
        filters.search = search.trim();
      }
      
      if (role && role.trim()) {
        filters.role = role.trim();
      }
      
      if (status && (status === 'active' || status === 'inactive')) {
        filters.status = status;
      }
      
      if (typeId && !isNaN(Number(typeId))) {
        filters.typeId = Number(typeId);
      }
      
      if (fichaId && !isNaN(Number(fichaId))) {
        filters.fichaId = Number(fichaId);
      }
      
      if (regionalId && !isNaN(Number(regionalId))) {
        filters.regionalId = Number(regionalId);
      }
      
      if (centerId && !isNaN(Number(centerId))) {
        filters.centerId = Number(centerId);
      }

      console.log('🔍 Filtros procesados:', filters);

      const result = await this.usersService.findAll(pageNum, limitNum, filters);
      
      console.log('✅ Consulta exitosa, retornando resultados');
      
      return result;

    } catch (error) {
      console.error('❌ Error en GET /users:', {
        message: error.message,
        stack: error.stack,
      });

      // Lanzar excepción HTTP específica
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al consultar usuarios',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('fichas')
  async getFichas() {
    try {
      console.log('🌐 GET /users/fichas');
      const result = await this.usersService.getFichas();
      console.log('✅ Fichas obtenidas exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en GET /users/fichas:', error);
      // En caso de error, retornar array vacío en lugar de fallar
      return [];
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
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener estadísticas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener usuario',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
          },
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al crear usuario',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      if (error.message.includes('ya está en uso')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
          },
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al actualizar usuario',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al eliminar usuario',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}