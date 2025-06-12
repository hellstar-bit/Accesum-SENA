// backend/src/config/competence.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Competence } from './entities/competence.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompetenceService {
  constructor(
    @InjectRepository(Competence)
    private readonly competenceRepository: Repository<Competence>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createCompetence(data: {
    code: string;
    name: string;
    description?: string;
    hours: number;
    programId: number;
    instructorIds: number[];
  }) {
    try {
      console.log('🔄 Creando competencia:', data);
      
      // Crear la competencia
      const competence = this.competenceRepository.create({
        code: data.code,
        name: data.name,
        description: data.description,
        hours: data.hours,
        programId: data.programId,
        isActive: true
      });

      const savedCompetence = await this.competenceRepository.save(competence);
      console.log('✅ Competencia guardada con ID:', savedCompetence.id);

      // Asignar instructores a la competencia si se proporcionaron
      if (data.instructorIds && data.instructorIds.length > 0) {
        await this.assignInstructorsToCompetence(savedCompetence.id, data.instructorIds);
      }

      // Retornar la competencia con sus relaciones
      const result = await this.competenceRepository.findOne({
        where: { id: savedCompetence.id },
        relations: ['program', 'instructors']
      });

      if (result) {
        console.log('✅ Competencia creada exitosamente:', {
          id: result.id,
          code: result.code,
          name: result.name,
          programId: result.programId,
          instructorsCount: result.instructors?.length || 0
        });
      } else {
        console.warn('⚠️ No se pudo recuperar la competencia recién creada');
      }

      return result;
    } catch (error) {
      console.error('❌ Error al crear competencia:', error);
      throw error;
    }
  }

  async assignInstructorsToCompetence(competenceId: number, instructorIds: number[]) {
    try {
      console.log('🔄 Asignando instructores a competencia:', { competenceId, instructorIds });
      
      // Obtener los instructores usando In() operator en lugar de findByIds (deprecado)
      const instructors = await this.userRepository.find({
        where: { 
          id: In(instructorIds),
          isActive: true
        }
      });
      
      if (instructors.length === 0) {
        console.warn('⚠️ No se encontraron instructores válidos');
        return;
      }

      console.log(`📋 Se encontraron ${instructors.length} instructores válidos`);

      // Obtener la competencia con sus instructores actuales
      const competence = await this.competenceRepository.findOne({
        where: { id: competenceId },
        relations: ['instructors']
      });

      if (!competence) {
        throw new Error('Competencia no encontrada');
      }

      // Asignar instructores evitando duplicados
      const currentInstructorIds = competence.instructors?.map(i => i.id) || [];
      const newInstructors = instructors.filter(instructor => 
        !currentInstructorIds.includes(instructor.id)
      );

      if (newInstructors.length > 0) {
        competence.instructors = [...(competence.instructors || []), ...newInstructors];
        await this.competenceRepository.save(competence);
        console.log(`✅ ${newInstructors.length} instructores asignados exitosamente`);
      } else {
        console.log('ℹ️ Todos los instructores ya estaban asignados');
      }
      
    } catch (error) {
      console.error('❌ Error al asignar instructores a competencia:', error);
      throw error;
    }
  }

  async getAllCompetences() {
    try {
      console.log('🔄 Obteniendo todas las competencias activas');
      
      const competences = await this.competenceRepository.find({
        where: { isActive: true },
        relations: ['program', 'instructors'],
        order: { code: 'ASC' }
      });

      console.log(`✅ Se encontraron ${competences.length} competencias activas`);
      
      // Log detallado para debugging
      competences.forEach(comp => {
        console.log(`  📝 ${comp.code}: ${comp.name} (ID: ${comp.id}, Programa: ${comp.programId})`);
      });
      
      return competences;
    } catch (error) {
      console.error('❌ Error al obtener competencias:', error);
      throw error;
    }
  }

  async getCompetenceById(id: number) {
    try {
      console.log(`🔄 Obteniendo competencia por ID: ${id}`);
      
      const competence = await this.competenceRepository.findOne({
        where: { id, isActive: true },
        relations: ['program', 'instructors', 'fichaAssignments']
      });

      if (competence) {
        console.log(`✅ Competencia encontrada: ${competence.code} - ${competence.name}`);
      } else {
        console.log(`⚠️ Competencia con ID ${id} no encontrada`);
      }

      return competence;
    } catch (error) {
      console.error('❌ Error al obtener competencia por ID:', error);
      throw error;
    }
  }

  // ✅ NUEVO MÉTODO para obtener competencias por programa
  async getCompetencesByProgram(programId: number) {
    try {
      console.log(`🔄 Obteniendo competencias para programa ${programId}`);
      
      const competences = await this.competenceRepository.find({
        where: { 
          programId,
          isActive: true 
        },
        relations: ['program', 'instructors'],
        order: { code: 'ASC' }
      });

      console.log(`✅ Se encontraron ${competences.length} competencias para el programa ${programId}`);
      return competences;
    } catch (error) {
      console.error('❌ Error al obtener competencias por programa:', error);
      throw error;
    }
  }
}