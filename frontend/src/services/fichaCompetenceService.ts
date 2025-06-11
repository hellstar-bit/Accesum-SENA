// frontend/src/services/fichaCompetenceService.ts
import api from './api';

class FichaCompetenceService {
  async getFichaCompetences(fichaId: number) {
    try {
      const response = await api.get(`/ficha-competences/ficha/${fichaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener competencias de ficha:', error);
      throw error;
    }
  }

  async getAvailableCompetences(fichaId: number) {
    try {
      const response = await api.get(`/ficha-competences/available/${fichaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener competencias disponibles:', error);
      throw error;
    }
  }

  async assignCompetenceToFicha(fichaId: number, competenceId: number) {
    try {
      const response = await api.post('/ficha-competences/assign', {
        fichaId,
        competenceId
      });
      return response.data;
    } catch (error) {
      console.error('Error al asignar competencia a ficha:', error);
      throw error;
    }
  }

  async removeCompetenceFromFicha(fichaId: number, competenceId: number) {
    try {
      const response = await api.delete(`/ficha-competences/remove/${fichaId}/${competenceId}`);
      return response.data;
    } catch (error) {
      console.error('Error al remover competencia de ficha:', error);
      throw error;
    }
  }
}

export const fichaCompetenceService = new FichaCompetenceService();
