// frontend/src/services/fichaCompetenceService.ts
import api from './api';

class FichaCompetenceService {
  async getFichaCompetences(fichaId: number) {
    try {
      console.log(`🔄 Frontend: Obteniendo competencias para ficha ${fichaId}`);
      const response = await api.get(`/ficha-competences/ficha/${fichaId}`);
      
      console.log(`✅ Frontend: ${response.data?.data?.length || 0} competencias obtenidas`);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener competencias de ficha:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  async getAvailableCompetences(fichaId: number) {
    try {
      console.log(`🔄 Frontend: Obteniendo competencias disponibles para ficha ${fichaId}`);
      const response = await api.get(`/ficha-competences/available/${fichaId}`);
      
      console.log('🔍 Frontend: Respuesta completa:', response.data);
      
      const competences = response.data?.data || response.data;
      console.log(`✅ Frontend: ${competences?.length || 0} competencias disponibles obtenidas`);
      
      // Log del debug info si está disponible
      if (response.data?.debug) {
        console.log('🔍 Frontend: Info de debug:', response.data.debug);
      }
      
      // Si no hay competencias disponibles, mostrar info adicional
      if (!competences || competences.length === 0) {
        console.log('⚠️ Frontend: No hay competencias disponibles');
        if (response.data?.debug) {
          const debug = response.data.debug;
          console.log(`   - Competencias del programa: ${debug.totalProgramCompetences}`);
          console.log(`   - Ya asignadas: ${debug.assignedCompetences}`);
          console.log(`   - Disponibles: ${debug.availableCompetences}`);
        }
      }
      
      return competences || [];
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener competencias disponibles:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  async assignCompetenceToFicha(fichaId: number, competenceId: number) {
    try {
      console.log(`🔄 Frontend: Asignando competencia ${competenceId} a ficha ${fichaId}`);
      
      const response = await api.post('/ficha-competences/assign', {
        fichaId,
        competenceId
      });
      
      console.log('✅ Frontend: Competencia asignada exitosamente');
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al asignar competencia a ficha:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  async removeCompetenceFromFicha(fichaId: number, competenceId: number) {
    try {
      console.log(`🔄 Frontend: Removiendo competencia ${competenceId} de ficha ${fichaId}`);
      
      const response = await api.delete(`/ficha-competences/remove/${fichaId}/${competenceId}`);
      
      console.log('✅ Frontend: Competencia removida exitosamente');
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al remover competencia de ficha:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  // ✅ NUEVO MÉTODO para debugging
  async debugFichaCompetences(fichaId: number) {
    try {
      console.log(`🔍 Frontend: Debug para ficha ${fichaId}`);
      const response = await api.get(`/ficha-competences/debug/${fichaId}`);
      
      const debugInfo = response.data?.data || response.data;
      console.log('🔍 Frontend: Debug info:', debugInfo);
      
      return debugInfo;
    } catch (error: any) {
      console.error('❌ Frontend: Error en debug:', error);
      return null;
    }
  }

  // ✅ NUEVO MÉTODO para obtener todas las competencias
  async getAllCompetences() {
    try {
      console.log('🔄 Frontend: Obteniendo todas las competencias');
      const response = await api.get('/competences');
      
      const competences = response.data?.data || response.data;
      console.log(`✅ Frontend: ${competences?.length || 0} competencias totales obtenidas`);
      
      return competences || [];
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener todas las competencias:', error);
      throw error;
    }
  }
}

export const fichaCompetenceService = new FichaCompetenceService();