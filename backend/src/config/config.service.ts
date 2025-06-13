// backend/src/config/config.service.ts - VERSIÓN CORREGIDA
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regional } from './entities/regional.entity';
import { Center } from './entities/center.entity';
import { Coordination } from './entities/coordination.entity';
import { Program } from './entities/program.entity';
import { PersonnelType } from './entities/personnel-type.entity';
import { Ficha } from './entities/ficha.entity';
import { Competence } from './entities/competence.entity';
import { Role } from '../users/entities/role.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Regional)
    private readonly regionalRepository: Repository<Regional>,
    
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    
    @InjectRepository(Coordination)
    private readonly coordinationRepository: Repository<Coordination>,
    
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    
    @InjectRepository(PersonnelType)
    private readonly personnelTypeRepository: Repository<PersonnelType>,
    
    @InjectRepository(Ficha)
    private readonly fichaRepository: Repository<Ficha>,
    
    @InjectRepository(Competence)
    private readonly competenceRepository: Repository<Competence>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // ==================== REGIONALES ====================

  async getAllRegionals(): Promise<Regional[]> {
    try {
      console.log('🔄 Obteniendo todas las regionales');
      
      const regionales = await this.regionalRepository.find({
        relations: ['centers'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${regionales.length} regionales`);
      return regionales;
    } catch (error) {
      console.error('❌ Error al obtener regionales:', error);
      throw error;
    }
  }

  async createRegional(data: { name: string }): Promise<Regional> {
    try {
      console.log('🔄 Creando nueva regional:', data);
      
      const regional = this.regionalRepository.create({
        name: data.name
      });
      
      const savedRegional = await this.regionalRepository.save(regional);
      console.log(`✅ Regional creada exitosamente con ID ${savedRegional.id}`);
      
      return savedRegional;
    } catch (error) {
      console.error('❌ Error al crear regional:', error);
      throw error;
    }
  }

  async updateRegional(id: number, data: { name: string }): Promise<Regional> {
    try {
      console.log(`🔄 Actualizando regional ${id}:`, data);
      
      const regional = await this.regionalRepository.findOne({ where: { id } });
      if (!regional) {
        throw new Error('Regional no encontrada');
      }
      
      regional.name = data.name;
      const updatedRegional = await this.regionalRepository.save(regional);
      
      console.log(`✅ Regional actualizada exitosamente`);
      return updatedRegional;
    } catch (error) {
      console.error('❌ Error al actualizar regional:', error);
      throw error;
    }
  }

  async deleteRegional(id: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando regional ${id}`);
      
      const regional = await this.regionalRepository.findOne({ where: { id } });
      if (!regional) {
        throw new Error('Regional no encontrada');
      }
      
      await this.regionalRepository.remove(regional);
      console.log(`✅ Regional eliminada exitosamente`);
    } catch (error) {
      console.error('❌ Error al eliminar regional:', error);
      throw error;
    }
  }

  // ==================== CENTROS ====================

  async getAllCenters(): Promise<Center[]> {
    try {
      console.log('🔄 Obteniendo todos los centros');
      
      const centers = await this.centerRepository.find({
        relations: ['regional', 'coordinations'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${centers.length} centros`);
      return centers;
    } catch (error) {
      console.error('❌ Error al obtener centros:', error);
      throw error;
    }
  }

  async getCentersByRegional(regionalId: number): Promise<Center[]> {
    try {
      console.log(`🔄 Obteniendo centros para regional ID ${regionalId}`);
      
      const centers = await this.centerRepository.find({
        where: { regionalId },
        relations: ['regional'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${centers.length} centros para la regional ${regionalId}`);
      return centers;
    } catch (error) {
      console.error(`❌ Error al obtener centros de regional ${regionalId}:`, error);
      throw error;
    }
  }

  async createCenter(data: { name: string; regionalId: number }): Promise<Center> {
    try {
      console.log('🔄 Creando nuevo centro:', data);
      
      const center = this.centerRepository.create({
        name: data.name,
        regionalId: data.regionalId
      });
      
      const savedCenter = await this.centerRepository.save(center);
      console.log(`✅ Centro creado exitosamente con ID ${savedCenter.id}`);
      
      // Retornar con relaciones
      const centerWithRelations = await this.centerRepository.findOne({
        where: { id: savedCenter.id },
        relations: ['regional']
      });
      
      return centerWithRelations!;
    } catch (error) {
      console.error('❌ Error al crear centro:', error);
      throw error;
    }
  }

  async updateCenter(id: number, data: { name?: string; regionalId?: number }): Promise<Center> {
    try {
      console.log(`🔄 Actualizando centro ${id}:`, data);
      
      const center = await this.centerRepository.findOne({ 
        where: { id },
        relations: ['regional']
      });
      if (!center) {
        throw new Error('Centro no encontrado');
      }
      
      if (data.name) center.name = data.name;
      if (data.regionalId) center.regionalId = data.regionalId;
      
      const updatedCenter = await this.centerRepository.save(center);
      
      // Retornar con relaciones actualizadas
      const centerWithRelations = await this.centerRepository.findOne({
        where: { id: updatedCenter.id },
        relations: ['regional']
      });
      
      return centerWithRelations!;
    } catch (error) {
      console.error('❌ Error al actualizar centro:', error);
      throw error;
    }
  }

  async deleteCenter(id: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando centro ${id}`);
      
      const center = await this.centerRepository.findOne({ where: { id } });
      if (!center) {
        throw new Error('Centro no encontrado');
      }
      
      await this.centerRepository.remove(center);
      console.log(`✅ Centro eliminado exitosamente`);
    } catch (error) {
      console.error('❌ Error al eliminar centro:', error);
      throw error;
    }
  }

  // ==================== COORDINACIONES ====================

  async getAllCoordinations(): Promise<Coordination[]> {
    try {
      console.log('🔄 Obteniendo todas las coordinaciones');
      
      const coordinations = await this.coordinationRepository.find({
        relations: ['center', 'center.regional', 'programs'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${coordinations.length} coordinaciones`);
      return coordinations;
    } catch (error) {
      console.error('❌ Error al obtener coordinaciones:', error);
      throw error;
    }
  }

  async createCoordination(data: { name: string; centerId: number }): Promise<Coordination> {
    try {
      console.log('🔄 Creando nueva coordinación:', data);
      
      const coordination = this.coordinationRepository.create({
        name: data.name,
        centerId: data.centerId
      });
      
      const savedCoordination = await this.coordinationRepository.save(coordination);
      console.log(`✅ Coordinación creada exitosamente con ID ${savedCoordination.id}`);
      
      // Retornar con relaciones
      const coordinationWithRelations = await this.coordinationRepository.findOne({
        where: { id: savedCoordination.id },
        relations: ['center', 'center.regional']
      });
      
      return coordinationWithRelations!;
    } catch (error) {
      console.error('❌ Error al crear coordinación:', error);
      throw error;
    }
  }

  async updateCoordination(id: number, data: { name?: string; centerId?: number }): Promise<Coordination> {
    try {
      console.log(`🔄 Actualizando coordinación ${id}:`, data);
      
      const coordination = await this.coordinationRepository.findOne({ 
        where: { id },
        relations: ['center', 'center.regional']
      });
      if (!coordination) {
        throw new Error('Coordinación no encontrada');
      }
      
      if (data.name) coordination.name = data.name;
      if (data.centerId) coordination.centerId = data.centerId;
      
      const updatedCoordination = await this.coordinationRepository.save(coordination);
      
      const coordinationWithRelations = await this.coordinationRepository.findOne({
        where: { id: updatedCoordination.id },
        relations: ['center', 'center.regional']
      });
      
      return coordinationWithRelations!;
    } catch (error) {
      console.error('❌ Error al actualizar coordinación:', error);
      throw error;
    }
  }

  async deleteCoordination(id: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando coordinación ${id}`);
      
      const coordination = await this.coordinationRepository.findOne({ where: { id } });
      if (!coordination) {
        throw new Error('Coordinación no encontrada');
      }
      
      await this.coordinationRepository.remove(coordination);
      console.log(`✅ Coordinación eliminada exitosamente`);
    } catch (error) {
      console.error('❌ Error al eliminar coordinación:', error);
      throw error;
    }
  }

  // ==================== PROGRAMAS ====================

  async getAllPrograms(): Promise<Program[]> {
    try {
      console.log('🔄 Obteniendo todos los programas');
      
      const programs = await this.programRepository.find({
        relations: ['coordination', 'coordination.center', 'competences'],
        order: { code: 'ASC' }
      });

      console.log(`✅ Se encontraron ${programs.length} programas`);
      return programs;
    } catch (error) {
      console.error('❌ Error al obtener programas:', error);
      throw error;
    }
  }

  async createProgram(data: {
    code: string;
    name: string;
    coordinationId: number;
    description?: string;
    totalHours?: number;
    status?: string;
  }): Promise<Program> {
    try {
      console.log('🔄 Creando nuevo programa:', data);

      // Verificar que la coordinación existe
      const coordination = await this.coordinationRepository.findOne({
        where: { id: data.coordinationId }
      });

      if (!coordination) {
        throw new Error('Coordinación no encontrada');
      }

      const programData = {
        code: data.code,
        name: data.name,
        coordinationId: data.coordinationId,
        description: data.description,
        totalHours: data.totalHours || 0,
        status: data.status || 'ACTIVO'
      };

      const program = this.programRepository.create(programData);
      const savedProgram = await this.programRepository.save(program);
      console.log(`✅ Programa creado exitosamente con ID ${savedProgram.id}`);

      // Retornar el programa con sus relaciones
      const programWithRelations = await this.programRepository.findOne({
        where: { id: savedProgram.id },
        relations: ['coordination', 'coordination.center']
      });
      
      return programWithRelations!;
    } catch (error) {
      console.error('❌ Error al crear programa:', error);
      throw error;
    }
  }

  // ==================== FICHAS ====================

  async getAllFichas(): Promise<Ficha[]> {
    try {
      console.log('🔄 Obteniendo todas las fichas');
      
      const fichas = await this.fichaRepository.find({
        relations: ['program', 'program.coordination'],
        order: { code: 'ASC' }
      });

      console.log(`✅ Se encontraron ${fichas.length} fichas`);
      return fichas;
    } catch (error) {
      console.error('❌ Error al obtener fichas:', error);
      throw error;
    }
  }

  async getFichaById(id: number): Promise<Ficha | null> {
    try {
      console.log(`🔄 Obteniendo ficha con ID ${id}`);
      
      const ficha = await this.fichaRepository.findOne({
        where: { id },
        relations: ['program', 'program.coordination', 'fichaCompetences', 'fichaCompetences.competence']
      });

      if (ficha) {
        console.log(`✅ Ficha encontrada: ${ficha.code} - ${ficha.name}`);
      } else {
        console.log(`⚠️ Ficha con ID ${id} no encontrada`);
      }

      return ficha;
    } catch (error) {
      console.error('❌ Error al obtener ficha por ID:', error);
      throw error;
    }
  }

  async createFicha(data: {
    code: string;
    name: string;
    programId: number;
    startDate?: string;
    endDate?: string;
    reportDate?: string;
    status?: string;
  }): Promise<Ficha> {
    try {
      console.log('🔄 Creando nueva ficha:', data);

      // Verificar que el programa existe
      const program = await this.programRepository.findOne({
        where: { id: data.programId }
      });

      if (!program) {
        throw new Error('Programa no encontrado');
      }

      const fichaData = {
        code: data.code,
        name: data.name,
        programId: data.programId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
        status: data.status || 'EN EJECUCIÓN',
        isActive: true
      };

      const ficha = this.fichaRepository.create(fichaData);
      const savedFicha = await this.fichaRepository.save(ficha);
      console.log(`✅ Ficha creada exitosamente con ID ${savedFicha.id}`);

      // Retornar la ficha con sus relaciones
      const fichaWithRelations = await this.getFichaById(savedFicha.id);
      return fichaWithRelations!;
    } catch (error) {
      console.error('❌ Error al crear ficha:', error);
      throw error;
    }
  }

  // ==================== ROLES ====================

  async getAllRoles(): Promise<Role[]> {
    try {
      console.log('🔄 Obteniendo todos los roles');
      
      const roles = await this.roleRepository.find({
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${roles.length} roles`);
      return roles;
    } catch (error) {
      console.error('❌ Error al obtener roles:', error);
      throw error;
    }
  }

  async createRole(data: { name: string; description?: string }): Promise<Role> {
    try {
      console.log('🔄 Creando nuevo rol:', data);
      
      const role = this.roleRepository.create({
        name: data.name,
        description: data.description
      });
      
      const savedRole = await this.roleRepository.save(role);
      console.log(`✅ Rol creado exitosamente con ID ${savedRole.id}`);
      
      return savedRole;
    } catch (error) {
      console.error('❌ Error al crear rol:', error);
      throw error;
    }
  }

  async updateRole(id: number, data: { name?: string; description?: string }): Promise<Role> {
    try {
      console.log(`🔄 Actualizando rol ${id}:`, data);
      
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new Error('Rol no encontrado');
      }
      
      if (data.name) role.name = data.name;
      if (data.description !== undefined) role.description = data.description;
      
      const updatedRole = await this.roleRepository.save(role);
      console.log(`✅ Rol actualizado exitosamente`);
      
      return updatedRole;
    } catch (error) {
      console.error('❌ Error al actualizar rol:', error);
      throw error;
    }
  }

  async deleteRole(id: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando rol ${id}`);
      
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new Error('Rol no encontrado');
      }
      
      await this.roleRepository.remove(role);
      console.log(`✅ Rol eliminado exitosamente`);
    } catch (error) {
      console.error('❌ Error al eliminar rol:', error);
      throw error;
    }
  }

  // ==================== TIPOS DE PERSONAL ====================

  async getAllPersonnelTypes(): Promise<PersonnelType[]> {
    try {
      console.log('🔄 Obteniendo todos los tipos de personal');
      
      const types = await this.personnelTypeRepository.find({
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${types.length} tipos de personal`);
      return types;
    } catch (error) {
      console.error('❌ Error al obtener tipos de personal:', error);
      throw error;
    }
  }

  async createPersonnelType(data: { name: string }): Promise<PersonnelType> {
    try {
      console.log('🔄 Creando nuevo tipo de personal:', data);
      
      const personnelType = this.personnelTypeRepository.create({
        name: data.name
      });
      
      const savedPersonnelType = await this.personnelTypeRepository.save(personnelType);
      console.log(`✅ Tipo de personal creado exitosamente con ID ${savedPersonnelType.id}`);
      
      return savedPersonnelType;
    } catch (error) {
      console.error('❌ Error al crear tipo de personal:', error);
      throw error;
    }
  }

  async updatePersonnelType(id: number, data: { name: string }): Promise<PersonnelType> {
    try {
      console.log(`🔄 Actualizando tipo de personal ${id}:`, data);
      
      const personnelType = await this.personnelTypeRepository.findOne({ where: { id } });
      if (!personnelType) {
        throw new Error('Tipo de personal no encontrado');
      }
      
      personnelType.name = data.name;
      const updatedPersonnelType = await this.personnelTypeRepository.save(personnelType);
      
      console.log(`✅ Tipo de personal actualizado exitosamente`);
      return updatedPersonnelType;
    } catch (error) {
      console.error('❌ Error al actualizar tipo de personal:', error);
      throw error;
    }
  }

  async deletePersonnelType(id: number): Promise<void> {
    try {
      console.log(`🔄 Eliminando tipo de personal ${id}`);
      
      const personnelType = await this.personnelTypeRepository.findOne({ where: { id } });
      if (!personnelType) {
        throw new Error('Tipo de personal no encontrado');
      }
      
      await this.personnelTypeRepository.remove(personnelType);
      console.log(`✅ Tipo de personal eliminado exitosamente`);
    } catch (error) {
      console.error('❌ Error al eliminar tipo de personal:', error);
      throw error;
    }
  }

  // ==================== COMPETENCIAS ====================

  async getAllCompetences(): Promise<Competence[]> {
    try {
      console.log('🔄 Obteniendo todas las competencias desde ConfigService');
      
      const competences = await this.competenceRepository.find({
        where: { isActive: true },
        relations: ['program', 'instructors'],
        order: { code: 'ASC' }
      });

      console.log(`✅ Se encontraron ${competences.length} competencias`);
      return competences;
    } catch (error) {
      console.error('❌ Error al obtener competencias:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS GENERALES ====================

  async getSystemStats() {
    try {
      console.log('🔄 Obteniendo estadísticas del sistema');
      
      const [
        totalFichas,
        activeFichas,
        totalPrograms,
        activePrograms,
        totalCompetences,
        activeCompetences
      ] = await Promise.all([
        this.fichaRepository.count(),
        this.fichaRepository.count({ where: { isActive: true } }),
        this.programRepository.count(),
        this.programRepository.count({ where: { status: 'ACTIVO' } }),
        this.competenceRepository.count(),
        this.competenceRepository.count({ where: { isActive: true } })
      ]);

      const stats = {
        fichas: { total: totalFichas, active: activeFichas },
        programs: { total: totalPrograms, active: activePrograms },
        competences: { total: totalCompetences, active: activeCompetences },
        lastUpdate: new Date()
      };

      console.log('✅ Estadísticas del sistema obtenidas');
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del sistema:', error);
      throw error;
    }
  }
}