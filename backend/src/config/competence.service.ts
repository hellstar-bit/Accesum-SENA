// backend/src/config/competence.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      // Asignar instructores a la competencia
      if (data.instructorIds.length > 0) {
        await this.assignInstructorsToCompetence(savedCompetence.id, data.instructorIds);
      }

      return savedCompetence;
    } catch (error) {
      console.error('Error al crear competencia:', error);
      throw error;
    }
  }

  async assignInstructorsToCompetence(competenceId: number, instructorIds: number[]) {
    try {
      // Insertar relaciones en instructor_competences
      const values = instructorIds.map(instructorId => 
        `(${instructorId}, ${competenceId})`
      ).join(', ');

      await this.competenceRepository.query(`
        INSERT IGNORE INTO instructor_competences (instructorId, competenceId) 
        VALUES ${values}
      `);
    } catch (error) {
      console.error('Error al asignar instructores a competencia:', error);
      throw error;
    }
  }

  async getAllCompetences() {
    try {
      return await this.competenceRepository.find({
        where: { isActive: true },
        relations: ['program', 'instructors'],
        order: { code: 'ASC' }
      });
    } catch (error) {
      console.error('Error al obtener competencias:', error);
      throw error;
    }
  }
}
