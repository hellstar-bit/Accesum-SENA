// backend/src/config/ficha-competence.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ficha } from './entities/ficha.entity';
import { Competence } from './entities/competence.entity';
import { FichaCompetence } from './entities/ficha-competence.entity';

@Injectable()
export class FichaCompetenceService {
  constructor(
    @InjectRepository(Ficha)
    private readonly fichaRepository: Repository<Ficha>,
    
    @InjectRepository(Competence)
    private readonly competenceRepository: Repository<Competence>,
    
    @InjectRepository(FichaCompetence)
    private readonly fichaCompetenceRepository: Repository<FichaCompetence>,
  ) {}

  async getFichaCompetences(fichaId: number) {
    try {
      const fichaCompetences = await this.fichaCompetenceRepository.find({
        where: { fichaId, isActive: true },
        relations: ['competence'],
        order: { assignedAt: 'DESC' }
      });

      return fichaCompetences.map(fc => ({
        id: fc.id,
        fichaId: fc.fichaId,
        competenceId: fc.competenceId,
        assignedAt: fc.assignedAt,
        competence: {
          id: fc.competence.id,
          code: fc.competence.code,
          name: fc.competence.name,
          hours: fc.competence.hours,
          description: fc.competence.description
        }
      }));
    } catch (error) {
      console.error('Error al obtener competencias de ficha:', error);
      throw error;
    }
  }

  async getAvailableCompetences(fichaId: number) {
    try {
      // Obtener la ficha con su programa
      const ficha = await this.fichaRepository.findOne({
        where: { id: fichaId },
        relations: ['program']
      });

      if (!ficha) {
        throw new Error('Ficha no encontrada');
      }

      // Obtener competencias ya asignadas a la ficha
      const assignedCompetences = await this.fichaCompetenceRepository.find({
        where: { fichaId, isActive: true },
        select: ['competenceId']
      });

      const assignedIds = assignedCompetences.map(ac => ac.competenceId);

      // Obtener competencias del programa que no están asignadas
      const availableCompetences = await this.competenceRepository
        .createQueryBuilder('competence')
        .where('competence.programId = :programId', { programId: ficha.programId })
        .andWhere('competence.isActive = :isActive', { isActive: true })
        .andWhere(assignedIds.length > 0 ? 'competence.id NOT IN (:...assignedIds)' : '1=1', { assignedIds })
        .orderBy('competence.code', 'ASC')
        .getMany();

      return availableCompetences;
    } catch (error) {
      console.error('Error al obtener competencias disponibles:', error);
      throw error;
    }
  }

  async assignCompetenceToFicha(fichaId: number, competenceId: number) {
    try {
      // Verificar si ya existe la asignación
      const existing = await this.fichaCompetenceRepository.findOne({
        where: { fichaId, competenceId }
      });

      if (existing) {
        if (existing.isActive) {
          throw new Error('La competencia ya está asignada a esta ficha');
        } else {
          // Reactivar asignación existente
          existing.isActive = true;
          existing.assignedAt = new Date();
          return await this.fichaCompetenceRepository.save(existing);
        }
      }

      // Crear nueva asignación
      const fichaCompetence = this.fichaCompetenceRepository.create({
        fichaId,
        competenceId,
        isActive: true,
        assignedAt: new Date()
      });

      return await this.fichaCompetenceRepository.save(fichaCompetence);
    } catch (error) {
      console.error('Error al asignar competencia a ficha:', error);
      throw error;
    }
  }

  async removeCompetenceFromFicha(fichaId: number, competenceId: number) {
    try {
      const fichaCompetence = await this.fichaCompetenceRepository.findOne({
        where: { fichaId, competenceId, isActive: true }
      });

      if (!fichaCompetence) {
        throw new Error('Asignación no encontrada');
      }

      // Marcar como inactiva en lugar de eliminar
      fichaCompetence.isActive = false;
      await this.fichaCompetenceRepository.save(fichaCompetence);

      return { message: 'Competencia removida de la ficha exitosamente' };
    } catch (error) {
      console.error('Error al remover competencia de ficha:', error);
      throw error;
    }
  }
}
