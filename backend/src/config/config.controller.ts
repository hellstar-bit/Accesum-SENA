// backend/src/config/config.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  ParseIntPipe,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Entities
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';

// DTOs
interface CreateRegionalDto {
  name: string;
}

interface UpdateRegionalDto {
  name?: string;
}

interface CreateCenterDto {
  name: string;
  regionalId: number;
}

interface UpdateCenterDto {
  name?: string;
  regionalId?: number;
}

interface CreateCoordinationDto {
  name: string;
  centerId: number;
}

interface UpdateCoordinationDto {
  name?: string;
  centerId?: number;
}

interface CreateProgramDto {
  name: string;
  coordinationId: number;
}

interface UpdateProgramDto {
  name?: string;
  coordinationId?: number;
}

interface CreatePersonnelTypeDto {
  name: string;
}

interface UpdatePersonnelTypeDto {
  name?: string;
}

interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: string;
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string;
}

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Solo administradores pueden configurar
export class ConfigController {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(PersonnelType)
    private personnelTypeRepository: Repository<PersonnelType>,
    @InjectRepository(Regional)
    private regionalRepository: Repository<Regional>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
    @InjectRepository(Coordination)
    private coordinationRepository: Repository<Coordination>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
  ) {}

  // ================================
  // ROLES
  // ================================
  @Get('roles')
  async getRoles() {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    // Verificar que no exista
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name }
    });
    
    if (existing) {
      throw new BadRequestException('Ya existe un rol con ese nombre');
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new BadRequestException('Rol no encontrado');
    }

    // Verificar nombre único si se está cambiando
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name }
      });
      if (existing) {
        throw new BadRequestException('Ya existe un rol con ese nombre');
      }
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['users']
    });
    
    if (!role) {
      throw new BadRequestException('Rol no encontrado');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestException('No se puede eliminar un rol que tiene usuarios asignados');
    }

    await this.roleRepository.remove(role);
    return { message: 'Rol eliminado correctamente' };
  }

  // ================================
  // TIPOS DE PERSONAL
  // ================================
  @Get('personnel-types')
  async getPersonnelTypes() {
    return this.personnelTypeRepository.find({
      order: { name: 'ASC' },
    });
  }

  @Post('personnel-types')
  async createPersonnelType(@Body() createPersonnelTypeDto: CreatePersonnelTypeDto) {
    const existing = await this.personnelTypeRepository.findOne({
      where: { name: createPersonnelTypeDto.name }
    });
    
    if (existing) {
      throw new BadRequestException('Ya existe un tipo de personal con ese nombre');
    }

    const personnelType = this.personnelTypeRepository.create(createPersonnelTypeDto);
    return this.personnelTypeRepository.save(personnelType);
  }

  @Put('personnel-types/:id')
  async updatePersonnelType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonnelTypeDto: UpdatePersonnelTypeDto
  ) {
    const personnelType = await this.personnelTypeRepository.findOne({ where: { id } });
    if (!personnelType) {
      throw new BadRequestException('Tipo de personal no encontrado');
    }

    // Verificar nombre único
    if (updatePersonnelTypeDto.name && updatePersonnelTypeDto.name !== personnelType.name) {
      const existing = await this.personnelTypeRepository.findOne({
        where: { name: updatePersonnelTypeDto.name }
      });
      if (existing) {
        throw new BadRequestException('Ya existe un tipo de personal con ese nombre');
      }
    }

    Object.assign(personnelType, updatePersonnelTypeDto);
    return this.personnelTypeRepository.save(personnelType);
  }

  @Delete('personnel-types/:id')
  async deletePersonnelType(@Param('id', ParseIntPipe) id: number) {
    const personnelType = await this.personnelTypeRepository.findOne({ 
      where: { id },
      relations: ['profiles']
    });
    
    if (!personnelType) {
      throw new BadRequestException('Tipo de personal no encontrado');
    }

    if (personnelType.profiles && personnelType.profiles.length > 0) {
      throw new BadRequestException('No se puede eliminar un tipo de personal que tiene perfiles asignados');
    }

    await this.personnelTypeRepository.remove(personnelType);
    return { message: 'Tipo de personal eliminado correctamente' };
  }

  // ================================
  // REGIONALES
  // ================================
  @Get('regionales')
  async getRegionales() {
    return this.regionalRepository.find({
      relations: ['centers'],
      order: { name: 'ASC' },
    });
  }

  @Post('regionales')
  async createRegional(@Body() createRegionalDto: CreateRegionalDto) {
    const existing = await this.regionalRepository.findOne({
      where: { name: createRegionalDto.name }
    });
    
    if (existing) {
      throw new BadRequestException('Ya existe una regional con ese nombre');
    }

    const regional = this.regionalRepository.create(createRegionalDto);
    return this.regionalRepository.save(regional);
  }

  @Put('regionales/:id')
  async updateRegional(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegionalDto: UpdateRegionalDto
  ) {
    const regional = await this.regionalRepository.findOne({ where: { id } });
    if (!regional) {
      throw new BadRequestException('Regional no encontrada');
    }

    // Verificar nombre único
    if (updateRegionalDto.name && updateRegionalDto.name !== regional.name) {
      const existing = await this.regionalRepository.findOne({
        where: { name: updateRegionalDto.name }
      });
      if (existing) {
        throw new BadRequestException('Ya existe una regional con ese nombre');
      }
    }

    Object.assign(regional, updateRegionalDto);
    return this.regionalRepository.save(regional);
  }

  @Delete('regionales/:id')
  async deleteRegional(@Param('id', ParseIntPipe) id: number) {
    const regional = await this.regionalRepository.findOne({ 
      where: { id },
      relations: ['centers', 'profiles']
    });
    
    if (!regional) {
      throw new BadRequestException('Regional no encontrada');
    }

    if (regional.centers && regional.centers.length > 0) {
      throw new BadRequestException('No se puede eliminar una regional que tiene centros asignados');
    }

    await this.regionalRepository.remove(regional);
    return { message: 'Regional eliminada correctamente' };
  }

  // ================================
  // CENTROS
  // ================================
  @Get('centers')
  async getCenters() {
    return this.centerRepository.find({
      relations: ['regional', 'coordinations'],
      order: { name: 'ASC' },
    });
  }

  @Get('centers/:regionalId')
  async getCentersByRegional(@Param('regionalId', ParseIntPipe) regionalId: number) {
    return this.centerRepository.find({
      where: { regionalId },
      relations: ['regional'],
      order: { name: 'ASC' },
    });
  }

  @Post('centers')
  async createCenter(@Body() createCenterDto: CreateCenterDto) {
    // Verificar que la regional existe
    const regional = await this.regionalRepository.findOne({
      where: { id: createCenterDto.regionalId }
    });
    
    if (!regional) {
      throw new BadRequestException('Regional no encontrada');
    }

    const center = this.centerRepository.create(createCenterDto);
    return this.centerRepository.save(center);
  }

  @Put('centers/:id')
  async updateCenter(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCenterDto: UpdateCenterDto
  ) {
    const center = await this.centerRepository.findOne({ where: { id } });
    if (!center) {
      throw new BadRequestException('Centro no encontrado');
    }

    // Verificar que la nueva regional existe si se especifica
    if (updateCenterDto.regionalId) {
      const regional = await this.regionalRepository.findOne({
        where: { id: updateCenterDto.regionalId }
      });
      if (!regional) {
        throw new BadRequestException('Regional no encontrada');
      }
    }

    Object.assign(center, updateCenterDto);
    return this.centerRepository.save(center);
  }

  @Delete('centers/:id')
  async deleteCenter(@Param('id', ParseIntPipe) id: number) {
    const center = await this.centerRepository.findOne({ 
      where: { id },
      relations: ['coordinations', 'profiles']
    });
    
    if (!center) {
      throw new BadRequestException('Centro no encontrado');
    }

    if (center.coordinations && center.coordinations.length > 0) {
      throw new BadRequestException('No se puede eliminar un centro que tiene coordinaciones asignadas');
    }

    await this.centerRepository.remove(center);
    return { message: 'Centro eliminado correctamente' };
  }

  // ================================
  // COORDINACIONES
  // ================================
  @Get('coordinations/:centerId')
  async getCoordinationsByCenter(@Param('centerId', ParseIntPipe) centerId: number) {
    return this.coordinationRepository.find({
      where: { centerId },
      relations: ['center', 'programs'],
      order: { name: 'ASC' },
    });
  }

  @Post('coordinations')
  async createCoordination(@Body() createCoordinationDto: CreateCoordinationDto) {
    // Verificar que el centro existe
    const center = await this.centerRepository.findOne({
      where: { id: createCoordinationDto.centerId }
    });
    
    if (!center) {
      throw new BadRequestException('Centro no encontrado');
    }

    const coordination = this.coordinationRepository.create(createCoordinationDto);
    return this.coordinationRepository.save(coordination);
  }

  @Put('coordinations/:id')
  async updateCoordination(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoordinationDto: UpdateCoordinationDto
  ) {
    const coordination = await this.coordinationRepository.findOne({ where: { id } });
    if (!coordination) {
      throw new BadRequestException('Coordinación no encontrada');
    }

    // Verificar que el nuevo centro existe si se especifica
    if (updateCoordinationDto.centerId) {
      const center = await this.centerRepository.findOne({
        where: { id: updateCoordinationDto.centerId }
      });
      if (!center) {
        throw new BadRequestException('Centro no encontrado');
      }
    }

    Object.assign(coordination, updateCoordinationDto);
    return this.coordinationRepository.save(coordination);
  }

  @Delete('coordinations/:id')
  async deleteCoordination(@Param('id', ParseIntPipe) id: number) {
    const coordination = await this.coordinationRepository.findOne({ 
      where: { id },
      relations: ['programs', 'profiles']
    });
    
    if (!coordination) {
      throw new BadRequestException('Coordinación no encontrada');
    }

    if (coordination.programs && coordination.programs.length > 0) {
      throw new BadRequestException('No se puede eliminar una coordinación que tiene programas asignados');
    }

    await this.coordinationRepository.remove(coordination);
    return { message: 'Coordinación eliminada correctamente' };
  }

  // ================================
  // PROGRAMAS
  // ================================
  @Get('programs/:coordinationId')
  async getProgramsByCoordination(@Param('coordinationId', ParseIntPipe) coordinationId: number) {
    return this.programRepository.find({
      where: { coordinationId },
      relations: ['coordination', 'fichas'],
      order: { name: 'ASC' },
    });
  }

  @Post('programs')
  async createProgram(@Body() createProgramDto: CreateProgramDto) {
    // Verificar que la coordinación existe
    const coordination = await this.coordinationRepository.findOne({
      where: { id: createProgramDto.coordinationId }
    });
    
    if (!coordination) {
      throw new BadRequestException('Coordinación no encontrada');
    }

    const program = this.programRepository.create(createProgramDto);
    return this.programRepository.save(program);
  }

  @Put('programs/:id')
  async updateProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProgramDto: UpdateProgramDto
  ) {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new BadRequestException('Programa no encontrado');
    }

    // Verificar que la nueva coordinación existe si se especifica
    if (updateProgramDto.coordinationId) {
      const coordination = await this.coordinationRepository.findOne({
        where: { id: updateProgramDto.coordinationId }
      });
      if (!coordination) {
        throw new BadRequestException('Coordinación no encontrada');
      }
    }

    Object.assign(program, updateProgramDto);
    return this.programRepository.save(program);
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id', ParseIntPipe) id: number) {
    const program = await this.programRepository.findOne({ 
      where: { id },
      relations: ['fichas', 'profiles']
    });
    
    if (!program) {
      throw new BadRequestException('Programa no encontrado');
    }

    if (program.fichas && program.fichas.length > 0) {
      throw new BadRequestException('No se puede eliminar un programa que tiene fichas asignadas');
    }

    await this.programRepository.remove(program);
    return { message: 'Programa eliminado correctamente' };
  }
}