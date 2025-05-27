// backend/src/users/users.controller.ts - Actualizado con filtro por ficha
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
  } from '@nestjs/common';
  import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard)
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get()
    findAll(
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '10',
      @Query('search') search?: string,
      @Query('role') role?: string,
      @Query('status') status?: string,
      @Query('typeId') typeId?: string,
      @Query('fichaId') fichaId?: string, // ⭐ NUEVO FILTRO
      @Query('regionalId') regionalId?: string,
      @Query('centerId') centerId?: string,
    ) {
      const filters = {
        search,
        role,
        status,
        typeId: typeId ? parseInt(typeId) : undefined,
        fichaId: fichaId ? parseInt(fichaId) : undefined, // ⭐ NUEVO FILTRO
        regionalId: regionalId ? parseInt(regionalId) : undefined,
        centerId: centerId ? parseInt(centerId) : undefined,
      };

      return this.usersService.findAll(+page, +limit, filters);
    }

    @Get('fichas')
    async getFichas() {
      return this.usersService.getFichas();
    }
  
    @Get('stats')
    getStats() {
      return this.usersService.getStats();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.usersService.findOne(id);
    }
  
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.create(createUserDto);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateUserDto: UpdateUserDto,
    ) {
      return this.usersService.update(id, updateUserDto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.usersService.remove(id);
    }
  }