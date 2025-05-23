// src/users/users.controller.ts
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
    ) {
      return this.usersService.findAll(+page, +limit);
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