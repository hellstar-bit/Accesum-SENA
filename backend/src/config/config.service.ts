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
import { Competence } from './entities/competence.entity';
import { FichaCompetence } from './entities/ficha-competence.entity';
import { User } from '../users/entities/user.entity';

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
    @InjectRepository(Competence)
    private readonly competenceRepository: Repository<Competence>,
    
    @InjectRepository(FichaCompetence)
    private readonly fichaCompetenceRepository: Repository<FichaCompetence>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ==========================================
  // REGIONALES
  // ==========================================
  async createCompetence(data: {
    code: string;
    name: string;
    description?: string;
    hours: number;
    programId: number;
    instructorIds: number[];
  }) {
    try {
      console.log('📋 Creando competencia:', data);

      // Verificar que los instructores existan
      const instructors = await this.userRepository.findByIds(data.instructorIds);
      if (instructors.length !== data.instructorIds.length) {
        throw new Error('Algunos instructores no fueron encontrados');
      }

      // Crear la competencia
      const competence = this.competenceRepository.create({
        code: data.code,
        name: data.name,
        description: data.description,
        hours: data.hours,
        programId: data.programId,
        instructors: instructors
      });

      const savedCompetence = await this.competenceRepository.save(competence);
      console.log('✅ Competencia creada exitosamente');
      return savedCompetence;
    } catch (error) {
      console.error('❌ Error al crear competencia:', error);
      throw error;
    }
  }

  async getInstructorsWithCompetences() {
  try {
    console.log('📋 Obteniendo instructores con competencias');
    
    const instructors = await this.userRepository.find({
      relations: ['profile', 'role', 'competences'],
      where: { 
        role: { name: 'Instructor' },
        isActive: true 
      },
      // ⭐ CORREGIR EL ORDER - USAR SINTAXIS CORRECTA DE TYPEORM
      order: { 
        profile: { 
          firstName: 'ASC' 
        } 
      }
    });

    const formattedInstructors = instructors.map(instructor => ({
      id: instructor.id,
      name: instructor.profile 
        ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
        : instructor.email,
      email: instructor.email,
      competences: instructor.competences || [],
      assignments: []
    }));

    console.log('✅ Instructores obtenidos:', formattedInstructors.length);
    return formattedInstructors;
  } catch (error) {
    console.error('❌ Error al obtener instructores:', error);
    return [];
  }
}

  // ⭐ OBTENER FICHAS CON SUS COMPETENCIAS - CORREGIDO


  
  
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
   

  
  

  // ⭐ OBTENER FICHAS CON SUS COMPETENCIAS (CORREGIR SI YA EXISTE)
  async getFichasWithCompetences() {
    try {
      console.log('📋 Obteniendo fichas con competencias');
      
      const fichas = await this.fichaRepository.find({
        relations: ['program', 'fichaCompetences', 'fichaCompetences.competence'],
        where: { isActive: true },
        order: { code: 'ASC' }
      });

      const formattedFichas = fichas.map(ficha => ({
        id: ficha.id,
        code: ficha.code,
        name: ficha.name,
        status: ficha.status,
        programId: ficha.program?.id,
        program: ficha.program,
        competences: ficha.fichaCompetences?.map(fc => fc.competence) || []
      }));

      console.log('✅ Fichas obtenidas:', formattedFichas.length);
      return formattedFichas;
    } catch (error) {
      console.error('❌ Error al obtener fichas:', error);
      return [];
    }
  }

  // ⭐ OBTENER COMPETENCIAS POR PROGRAMA
  async getCompetencesByProgram(programId: number) {
    try {
      console.log(`📋 Obteniendo competencias del programa ${programId}`);
      
      const competences = await this.competenceRepository.find({
        where: { 
          programId,
          isActive: true 
        },
        relations: ['instructors', 'instructors.profile'],
        order: { name: 'ASC' }
      });

      console.log('✅ Competencias del programa obtenidas:', competences.length);
      return competences;
    } catch (error) {
      console.error('❌ Error al obtener competencias del programa:', error);
      return [];
    }
  }

  // ⭐ ASIGNAR COMPETENCIA A FICHA
  async assignCompetenceToFicha(data: {
    fichaId: number;
    competenceId: number;
  }) {
    try {
      console.log('📋 Asignando competencia a ficha:', data);

      // Verificar si ya existe la asignación
      const existingAssignment = await this.fichaCompetenceRepository.findOne({
        where: {
          fichaId: data.fichaId,
          competenceId: data.competenceId,
          isActive: true
        }
      });

      if (existingAssignment) {
        throw new Error('La competencia ya está asignada a esta ficha');
      }

      // Crear nueva asignación
      const assignment = this.fichaCompetenceRepository.create({
        fichaId: data.fichaId,
        competenceId: data.competenceId,
        isActive: true
      });

      const savedAssignment = await this.fichaCompetenceRepository.save(assignment);
      console.log('✅ Competencia asignada a ficha exitosamente');
      return savedAssignment;
    } catch (error) {
      console.error('❌ Error al asignar competencia a ficha:', error);
      throw error;
    }
  }
  

 
  async getInstructorsByCompetence(competenceId: number) {
    try {
      console.log(`📋 Obteniendo instructores de la competencia ${competenceId}`);
      
      const competence = await this.competenceRepository.findOne({
        where: { id: competenceId },
        relations: ['instructors', 'instructors.profile']
      });

      if (!competence) {
        throw new Error('Competencia no encontrada');
      }

      const formattedInstructors = competence.instructors.map(instructor => ({
        id: instructor.id,
        name: instructor.profile 
          ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
          : instructor.email,
        email: instructor.email
      }));

      console.log('✅ Instructores de la competencia obtenidos:', formattedInstructors.length);
      return formattedInstructors;
    } catch (error) {
      console.error('❌ Error al obtener instructores de la competencia:', error);
      return [];
    }
  }
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

      // ✅ CORRECCIÓN: Crear el objeto directamente
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

      // Verificar que la coordinación existe
      const coordination = await this.coordinationRepository.findOne({
        where: { id: data.coordinationId }
      });

      if (!coordination) {
        throw new Error('Coordinación no encontrada');
      }

      const program = this.programRepository.create({
        code: data.code,
        name: data.name,
        coordinationId: data.coordinationId,
        description: data.description,
        totalHours: data.totalHours || 0,
        status: data.status || 'ACTIVO'
      });

      const savedProgram = await this.programRepository.save(program);
      console.log(`✅ Programa creado exitosamente con ID ${savedProgram.id}`);

      // Retornar el programa con sus relaciones
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

  // ✅ MÉTODO PARA OBTENER COMPETENCIAS (referencia al competence.service)
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



