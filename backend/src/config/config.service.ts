// backend/src/config/config.service.ts - ACTUALIZADO CON getCentersByRegional
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';
import { Ficha } from './entities/ficha.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Role } from '../users/entities/role.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Regional)
    private regionalRepository: Repository<Regional>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
    @InjectRepository(Coordination)
    private coordinationRepository: Repository<Coordination>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
    @InjectRepository(PersonnelType)
    private personnelTypeRepository: Repository<PersonnelType>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // ==========================================
  // REGIONALES
  // ==========================================
  async getRegionales(): Promise<Regional[]> {
    return await this.regionalRepository.find({
      order: { name: 'ASC' }
    });
  }

  async createRegional(data: { name: string }): Promise<Regional> {
    // Verificar que no exista una regional con el mismo nombre
    const existing = await this.regionalRepository.findOne({
      where: { name: data.name }
    });

    if (existing) {
      throw new BadRequestException('Ya existe una regional con ese nombre');
    }

    const regional = this.regionalRepository.create(data);
    return await this.regionalRepository.save(regional);
  }

  async updateRegional(id: number, data: { name: string }): Promise<Regional> {
    const regional = await this.regionalRepository.findOne({ where: { id } });
    
    if (!regional) {
      throw new NotFoundException('Regional no encontrada');
    }

    // Verificar que no exista otra regional con el mismo nombre
    const existing = await this.regionalRepository.findOne({
      where: { name: data.name }
    });

    if (existing && existing.id !== id) {
      throw new BadRequestException('Ya existe una regional con ese nombre');
    }

    Object.assign(regional, data);
    return await this.regionalRepository.save(regional);
  }

  async deleteRegional(id: number): Promise<void> {
    const regional = await this.regionalRepository.findOne({
      where: { id },
      relations: ['centers']
    });

    if (!regional) {
      throw new NotFoundException('Regional no encontrada');
    }

    if (regional.centers && regional.centers.length > 0) {
      throw new BadRequestException('No se puede eliminar una regional que tiene centros asociados');
    }

    await this.regionalRepository.remove(regional);
  }

  // ⭐ NUEVO: OBTENER CENTROS POR REGIONAL
  async getCentersByRegional(regionalId: number): Promise<Center[]> {
    // Primero verificar que la regional existe
    const regional = await this.regionalRepository.findOne({
      where: { id: regionalId }
    });

    if (!regional) {
      throw new NotFoundException('Regional no encontrada');
    }

    // Obtener centros filtrados por regional
    return await this.centerRepository.find({
      where: { regionalId: regionalId },
      relations: ['regional'],
      order: { name: 'ASC' }
    });
  }

  // ==========================================
  // CENTROS
  // ==========================================
  async getCenters(): Promise<Center[]> {
    return await this.centerRepository.find({
      relations: ['regional'],
      order: { name: 'ASC' }
    });
  }

  async createCenter(data: { name: string; regionalId: number }): Promise<Center> {
    const regional = await this.regionalRepository.findOne({
      where: { id: data.regionalId }
    });

    if (!regional) {
      throw new NotFoundException('Regional no encontrada');
    }

    const center = this.centerRepository.create(data);
    return await this.centerRepository.save(center);
  }

  async updateCenter(id: number, data: { name?: string; regionalId?: number }): Promise<Center> {
    const center = await this.centerRepository.findOne({ where: { id } });
    
    if (!center) {
      throw new NotFoundException('Centro no encontrado');
    }

    if (data.regionalId) {
      const regional = await this.regionalRepository.findOne({
        where: { id: data.regionalId }
      });

      if (!regional) {
        throw new NotFoundException('Regional no encontrada');
      }
    }

    Object.assign(center, data);
    return await this.centerRepository.save(center);
  }

  async deleteCenter(id: number): Promise<void> {
    const center = await this.centerRepository.findOne({
      where: { id },
      relations: ['coordinations']
    });

    if (!center) {
      throw new NotFoundException('Centro no encontrado');
    }

    if (center.coordinations && center.coordinations.length > 0) {
      throw new BadRequestException('No se puede eliminar un centro que tiene coordinaciones asociadas');
    }

    await this.centerRepository.remove(center);
  }

  // ==========================================
  // COORDINACIONES
  // ==========================================
  async getCoordinations(): Promise<Coordination[]> {
    return await this.coordinationRepository.find({
      relations: ['center', 'center.regional'],
      order: { name: 'ASC' }
    });
  }

  async getCoordinationsByCenter(centerId: number): Promise<Coordination[]> {
    return await this.coordinationRepository.find({
      where: { centerId },
      relations: ['center'],
      order: { name: 'ASC' }
    });
  }

  async createCoordination(data: { name: string; centerId: number }): Promise<Coordination> {
    const center = await this.centerRepository.findOne({
      where: { id: data.centerId }
    });

    if (!center) {
      throw new NotFoundException('Centro no encontrado');
    }

    const coordination = this.coordinationRepository.create(data);
    return await this.coordinationRepository.save(coordination);
  }

  async updateCoordination(id: number, data: { name?: string; centerId?: number }): Promise<Coordination> {
    const coordination = await this.coordinationRepository.findOne({ where: { id } });
    
    if (!coordination) {
      throw new NotFoundException('Coordinación no encontrada');
    }

    if (data.centerId) {
      const center = await this.centerRepository.findOne({
        where: { id: data.centerId }
      });

      if (!center) {
        throw new NotFoundException('Centro no encontrado');
      }
    }

    Object.assign(coordination, data);
    return await this.coordinationRepository.save(coordination);
  }

  async deleteCoordination(id: number): Promise<void> {
    const coordination = await this.coordinationRepository.findOne({
      where: { id },
      relations: ['programs']
    });

    if (!coordination) {
      throw new NotFoundException('Coordinación no encontrada');
    }

    if (coordination.programs && coordination.programs.length > 0) {
      throw new BadRequestException('No se puede eliminar una coordinación que tiene programas asociados');
    }

    await this.coordinationRepository.remove(coordination);
  }

  // ==========================================
  // PROGRAMAS
  // ==========================================
  async getPrograms(): Promise<Program[]> {
    return await this.programRepository.find({
      relations: ['coordination', 'coordination.center', 'coordination.center.regional'],
      order: { name: 'ASC' }
    });
  }

  async createProgram(data: { name: string; coordinationId: number }): Promise<Program> {
    const coordination = await this.coordinationRepository.findOne({
      where: { id: data.coordinationId }
    });

    if (!coordination) {
      throw new NotFoundException('Coordinación no encontrada');
    }

    const program = this.programRepository.create(data);
    return await this.programRepository.save(program);
  }

  async updateProgram(id: number, data: { name?: string; coordinationId?: number }): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id } });
    
    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }

    if (data.coordinationId) {
      const coordination = await this.coordinationRepository.findOne({
        where: { id: data.coordinationId }
      });

      if (!coordination) {
        throw new NotFoundException('Coordinación no encontrada');
      }
    }

    Object.assign(program, data);
    return await this.programRepository.save(program);
  }

  async deleteProgram(id: number): Promise<void> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['fichas']
    });

    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }

    if (program.fichas && program.fichas.length > 0) {
      throw new BadRequestException('No se puede eliminar un programa que tiene fichas asociadas');
    }

    await this.programRepository.remove(program);
  }

  // ==========================================
  // FICHAS
  // ==========================================
  async getFichas(): Promise<Ficha[]> {
    return await this.fichaRepository.find({
      relations: ['program', 'program.coordination', 'program.coordination.center'],
      order: { code: 'ASC' }
    });
  }

  async createFicha(data: { 
    code: string; 
    name: string; 
    programId: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Ficha> {
    const program = await this.programRepository.findOne({
      where: { id: data.programId }
    });

    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }

    // Verificar que no exista una ficha con el mismo código
    const existing = await this.fichaRepository.findOne({
      where: { code: data.code }
    });

    if (existing) {
      throw new BadRequestException('Ya existe una ficha con ese código');
    }

    const ficha = this.fichaRepository.create({
      ...data,
      status: data.status || 'EN EJECUCIÓN'
    });
    
    return await this.fichaRepository.save(ficha);
  }

  async updateFicha(id: number, data: { 
    code?: string; 
    name?: string; 
    programId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Ficha> {
    const ficha = await this.fichaRepository.findOne({ where: { id } });
    
    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    if (data.programId) {
      const program = await this.programRepository.findOne({
        where: { id: data.programId }
      });

      if (!program) {
        throw new NotFoundException('Programa no encontrado');
      }
    }

    if (data.code && data.code !== ficha.code) {
      const existing = await this.fichaRepository.findOne({
        where: { code: data.code }
      });

      if (existing) {
        throw new BadRequestException('Ya existe una ficha con ese código');
      }
    }

    Object.assign(ficha, data);
    return await this.fichaRepository.save(ficha);
  }

  async deleteFicha(id: number): Promise<void> {
    const ficha = await this.fichaRepository.findOne({
      where: { id },
      relations: ['profiles']
    });

    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    if (ficha.profiles && ficha.profiles.length > 0) {
      throw new BadRequestException('No se puede eliminar una ficha que tiene aprendices asociados');
    }

    await this.fichaRepository.remove(ficha);
  }

  // ==========================================
  // ROLES
  // ==========================================
  async getRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { name: 'ASC' }
    });
  }

  async createRole(data: { name: string; description?: string }): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: data.name }
    });

    if (existing) {
      throw new BadRequestException('Ya existe un rol con ese nombre');
    }

    const role = this.roleRepository.create(data);
    return await this.roleRepository.save(role);
  }

  async updateRole(id: number, data: { name?: string; description?: string }): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (data.name && data.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: data.name }
      });

      if (existing) {
        throw new BadRequestException('Ya existe un rol con ese nombre');
      }
    }

    Object.assign(role, data);
    return await this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users']
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestException('No se puede eliminar un rol que tiene usuarios asociados');
    }

    await this.roleRepository.remove(role);
  }

  // ==========================================
  // TIPOS DE PERSONAL
  // ==========================================
  async getPersonnelTypes(): Promise<PersonnelType[]> {
    return await this.personnelTypeRepository.find({
      order: { name: 'ASC' }
    });
  }

  async createPersonnelType(data: { name: string }): Promise<PersonnelType> {
    const existing = await this.personnelTypeRepository.findOne({
      where: { name: data.name }
    });

    if (existing) {
      throw new BadRequestException('Ya existe un tipo de personal con ese nombre');
    }

    const type = this.personnelTypeRepository.create(data);
    return await this.personnelTypeRepository.save(type);
  }

  async updatePersonnelType(id: number, data: { name: string }): Promise<PersonnelType> {
    const type = await this.personnelTypeRepository.findOne({ where: { id } });
    
    if (!type) {
      throw new NotFoundException('Tipo de personal no encontrado');
    }

    const existing = await this.personnelTypeRepository.findOne({
      where: { name: data.name }
    });

    if (existing && existing.id !== id) {
      throw new BadRequestException('Ya existe un tipo de personal con ese nombre');
    }

    Object.assign(type, data);
    return await this.personnelTypeRepository.save(type);
  }

  async deletePersonnelType(id: number): Promise<void> {
    const type = await this.personnelTypeRepository.findOne({
      where: { id },
      relations: ['profiles']
    });

    if (!type) {
      throw new NotFoundException('Tipo de personal no encontrado');
    }

    if (type.profiles && type.profiles.length > 0) {
      throw new BadRequestException('No se puede eliminar un tipo de personal que tiene perfiles asociados');
    }

    await this.personnelTypeRepository.remove(type);
  }

  // ==========================================
  // JERARQUÍA COMPLETA
  // ==========================================
  async getHierarchy(): Promise<{
    regionales: Regional[];
    centers: Center[];
    coordinations: Coordination[];
    programs: Program[];
    fichas: Ficha[];
    roles: Role[];
    personnelTypes: PersonnelType[];
  }> {
    const [regionales, centers, coordinations, programs, fichas, roles, personnelTypes] = await Promise.all([
      this.getRegionales(),
      this.getCenters(),
      this.getCoordinations(),
      this.getPrograms(),
      this.getFichas(),
      this.getRoles(),
      this.getPersonnelTypes()
    ]);

    return {
      regionales,
      centers,
      coordinations,
      programs,
      fichas,
      roles,
      personnelTypes
    };
  }
}