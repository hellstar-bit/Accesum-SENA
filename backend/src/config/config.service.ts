// backend/src/config/config.service.ts - CON MÉTODO FALTANTE AGREGADO
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

  // ✅ MÉTODOS PARA FICHAS
  async getAllFichas() {
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

  async getFichaById(id: number) {
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
  }) {
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

      return await this.getFichaById(savedFicha.id);
    } catch (error) {
      console.error('❌ Error al crear ficha:', error);
      throw error;
    }
  }

  // ✅ MÉTODOS PARA PROGRAMAS
  async getAllPrograms() {
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
  }) {
    try {
      console.log('🔄 Creando nuevo programa:', data);

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

      return await this.programRepository.findOne({
        where: { id: savedProgram.id },
        relations: ['coordination', 'coordination.center']
      });
    } catch (error) {
      console.error('❌ Error al crear programa:', error);
      throw error;
    }
  }

  // ✅ MÉTODOS PARA COORDINACIONES
  async getAllCoordinations() {
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

  // ✅ MÉTODOS PARA CENTROS
  async getAllCenters() {
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

  // 🆕 NUEVO: OBTENER CENTROS POR REGIONAL
  async getCentersByRegional(regionalId: number) {
    try {
      console.log(`🔄 Obteniendo centros para regional ID ${regionalId}`);
      
      const centers = await this.centerRepository.find({
        where: { regionalId }, // o { regional: { id: regionalId } } dependiendo de tu schema
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

  // ✅ MÉTODOS PARA REGIONALES
  async getAllRegionals() {
    try {
      console.log('🔄 Obteniendo todas las regionales');
      
      const regionals = await this.regionalRepository.find({
        relations: ['centers'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Se encontraron ${regionals.length} regionales`);
      return regionals;
    } catch (error) {
      console.error('❌ Error al obtener regionales:', error);
      throw error;
    }
  }

  // ✅ MÉTODO PARA OBTENER COMPETENCIAS
  async getAllCompetences() {
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

  // ✅ MÉTODOS PARA TIPOS DE PERSONAL
  async getAllPersonnelTypes() {
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

  // ✅ MÉTODOS PARA ROLES
  async getAllRoles() {
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

  // ✅ MÉTODO DE ESTADÍSTICAS GENERALES
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