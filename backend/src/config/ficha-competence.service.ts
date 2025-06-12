// backend/src/config/ficha-competence.service.ts - CORRECCIÓN FINAL
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
      console.log(`🔄 Obteniendo competencias para ficha ${fichaId}`);
      
      const fichaCompetences = await this.fichaCompetenceRepository.find({
        where: { fichaId, isActive: true },
        relations: ['competence', 'competence.program'],
        order: { assignedAt: 'DESC' }
      });

      const result = fichaCompetences.map(fc => ({
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

      console.log(`✅ Se encontraron ${result.length} competencias asignadas`);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener competencias de ficha:', error);
      throw error;
    }
  }

  async getAvailableCompetences(fichaId: number) {
    try {
      console.log(`🔄 DEBUGGING - Obteniendo competencias disponibles para ficha ${fichaId}`);
      
      // 1. Obtener la ficha con su programa
      const ficha = await this.fichaRepository.findOne({
        where: { id: fichaId, isActive: true },
        relations: ['program']
      });

      if (!ficha) {
        console.error(`❌ Ficha ${fichaId} no encontrada`);
        throw new Error('Ficha no encontrada');
      }

      console.log(`📋 Ficha encontrada: ${ficha.name}`);
      console.log(`🎯 Programa ID: ${ficha.programId}`);
      console.log(`🎯 Programa: ${ficha.program?.name || 'Sin programa'}`);

      // 2. Obtener TODAS las competencias del programa (sin filtrar por asignaciones todavía)
      const allProgramCompetences = await this.competenceRepository.find({
        where: { 
          programId: ficha.programId,
          isActive: true 
        },
        relations: ['program'],
        order: { code: 'ASC' }
      });

      console.log(`📝 Total competencias del programa: ${allProgramCompetences.length}`);
      allProgramCompetences.forEach(comp => {
        console.log(`  - ${comp.code}: ${comp.name} (ID: ${comp.id})`);
      });

      // 3. Obtener competencias ya asignadas a esta ficha
      const assignedCompetences = await this.fichaCompetenceRepository.find({
        where: { fichaId, isActive: true },
        select: ['competenceId']
      });

      const assignedIds = assignedCompetences.map(ac => ac.competenceId);
      console.log(`📌 Competencias ya asignadas: [${assignedIds.join(', ')}]`);

      // 4. Filtrar competencias disponibles
      const availableCompetences = allProgramCompetences.filter(comp => 
        !assignedIds.includes(comp.id)
      );

      console.log(`✅ Competencias disponibles para asignar: ${availableCompetences.length}`);
      availableCompetences.forEach(comp => {
        console.log(`  ✓ ${comp.code}: ${comp.name} (ID: ${comp.id})`);
      });

      // 5. Si no hay competencias disponibles, hacer debug adicional
      if (availableCompetences.length === 0) {
        console.log('⚠️ NO HAY COMPETENCIAS DISPONIBLES - Debug adicional:');
        console.log(`   - Total en programa: ${allProgramCompetences.length}`);
        console.log(`   - Ya asignadas: ${assignedIds.length}`);
        console.log(`   - IDs asignados: [${assignedIds.join(', ')}]`);
        
        // Verificar si las competencias realmente pertenecen al programa
        const competenceCheckPromises = assignedIds.map(async (id) => {
          const comp = await this.competenceRepository.findOne({
            where: { id },
            relations: ['program']
          });
          console.log(`   - Competencia ${id}: ${comp?.name} (Programa: ${comp?.programId})`);
          return comp;
        });
        await Promise.all(competenceCheckPromises);
      }

      return availableCompetences;
    } catch (error) {
      console.error('❌ Error al obtener competencias disponibles:', error);
      throw error;
    }
  }

  async assignCompetenceToFicha(fichaId: number, competenceId: number) {
    try {
      console.log(`🔄 Asignando competencia ${competenceId} a ficha ${fichaId}`);
      
      // 1. Verificar que la ficha existe
      const ficha = await this.fichaRepository.findOne({
        where: { id: fichaId, isActive: true },
        relations: ['program']
      });

      if (!ficha) {
        throw new Error('Ficha no encontrada');
      }

      // 2. Verificar que la competencia existe y pertenece al programa de la ficha
      const competence = await this.competenceRepository.findOne({
        where: { id: competenceId, isActive: true },
        relations: ['program']
      });

      if (!competence) {
        throw new Error('Competencia no encontrada');
      }

      if (competence.programId !== ficha.programId) {
        console.error(`❌ Competencia ${competenceId} no pertenece al programa ${ficha.programId}`);
        throw new Error('La competencia no pertenece al programa de la ficha');
      }

      console.log(`✅ Validaciones pasadas - Competencia ${competence.code} pertenece al programa`);

      // 3. Verificar si ya existe la asignación
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
          const result = await this.fichaCompetenceRepository.save(existing);
          console.log('✅ Asignación reactivada exitosamente');
          return result;
        }
      }

      // 4. Crear nueva asignación
      const fichaCompetence = this.fichaCompetenceRepository.create({
        fichaId,
        competenceId,
        isActive: true,
        assignedAt: new Date()
      });

      const result = await this.fichaCompetenceRepository.save(fichaCompetence);
      console.log('✅ Nueva asignación creada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al asignar competencia a ficha:', error);
      throw error;
    }
  }

  async removeCompetenceFromFicha(fichaId: number, competenceId: number) {
    try {
      console.log(`🔄 Removiendo competencia ${competenceId} de ficha ${fichaId}`);
      
      const fichaCompetence = await this.fichaCompetenceRepository.findOne({
        where: { fichaId, competenceId, isActive: true }
      });

      if (!fichaCompetence) {
        throw new Error('Asignación no encontrada');
      }

      // Marcar como inactiva en lugar de eliminar
      fichaCompetence.isActive = false;
      await this.fichaCompetenceRepository.save(fichaCompetence);

      console.log('✅ Competencia removida exitosamente');
      return { message: 'Competencia removida de la ficha exitosamente' };
    } catch (error) {
      console.error('❌ Error al remover competencia de ficha:', error);
      throw error;
    }
  }

  // ✅ MÉTODO DE DEBUGGING MEJORADO
  async debugFichaCompetences(fichaId: number) {
    try {
      console.log(`🔍 === DEBUGGING COMPLETO - Ficha ID: ${fichaId} ===`);
      
      // 1. Información de la ficha
      const ficha = await this.fichaRepository.findOne({
        where: { id: fichaId },
        relations: ['program']
      });
      
      if (!ficha) {
        console.log('❌ Ficha no encontrada');
        return { error: 'Ficha no encontrada' };
      }

      console.log(`📋 Ficha: ${ficha.name} (ID: ${ficha.id})`);
      console.log(`🎯 Programa: ${ficha.program?.name || 'Sin programa'} (ID: ${ficha.programId})`);

      // 2. Competencias del programa
      const allCompetences = await this.competenceRepository.find({
        where: { programId: ficha.programId, isActive: true },
        order: { code: 'ASC' }
      });
      
      console.log(`📚 Total competencias del programa: ${allCompetences.length}`);
      allCompetences.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.code}: ${comp.name} (ID: ${comp.id})`);
      });

      // 3. Competencias asignadas
      const assigned = await this.fichaCompetenceRepository.find({
        where: { fichaId, isActive: true },
        relations: ['competence']
      });
      
      console.log(`📝 Total asignadas a la ficha: ${assigned.length}`);
      assigned.forEach((fc, index) => {
        console.log(`  ${index + 1}. ${fc.competence?.code}: ${fc.competence?.name} (ID: ${fc.competenceId})`);
      });

      // 4. Competencias disponibles
      const assignedIds = assigned.map(a => a.competenceId);
      const available = allCompetences.filter(comp => !assignedIds.includes(comp.id));
      
      console.log(`✅ Competencias disponibles: ${available.length}`);
      available.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.code}: ${comp.name} (ID: ${comp.id})`);
      });

      console.log(`🔍 === FIN DEBUG ===`);

      return {
        ficha: {
          id: ficha.id,
          name: ficha.name,
          programId: ficha.programId,
          programName: ficha.program?.name
        },
        totalProgramCompetences: allCompetences.length,
        assignedCompetences: assigned.length,
        availableCompetences: available.length,
        competences: {
          all: allCompetences.map(c => ({ id: c.id, code: c.code, name: c.name })),
          assigned: assigned.map(fc => ({ 
            id: fc.competence?.id, 
            code: fc.competence?.code, 
            name: fc.competence?.name 
          })),
          available: available.map(c => ({ id: c.id, code: c.code, name: c.name }))
        }
      };
    } catch (error) {
      console.error('❌ Error en debugging:', error);
      return { error: error.message };
    }
  }
}