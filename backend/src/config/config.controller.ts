// src/config/config.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';

@Controller('config')
@UseGuards(JwtAuthGuard)
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

  @Get('roles')
  async getRoles() {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  @Get('personnel-types')
  async getPersonnelTypes() {
    return this.personnelTypeRepository.find({
      order: { name: 'ASC' },
    });
  }

  @Get('regionales')
  async getRegionales() {
    return this.regionalRepository.find({
      order: { name: 'ASC' },
    });
  }

  @Get('centers')
  async getCenters() {
    return this.centerRepository.find({
      relations: ['regional'],
      order: { name: 'ASC' },
    });
  }

  @Get('centers/:regionalId')
  async getCentersByRegional(regionalId: number) {
    return this.centerRepository.find({
      where: { regionalId },
      order: { name: 'ASC' },
    });
  }

  @Get('coordinations/:centerId')
  async getCoordinationsByCenter(centerId: number) {
    return this.coordinationRepository.find({
      where: { centerId },
      order: { name: 'ASC' },
    });
  }

  @Get('programs/:coordinationId')
  async getProgramsByCoordination(coordinationId: number) {
    return this.programRepository.find({
      where: { coordinationId },
      order: { name: 'ASC' },
    });
  }
}