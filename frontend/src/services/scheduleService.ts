import api from './api';

export interface TrimesterScheduleData {
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';
  startTime: string;
  endTime: string;
  competenceId: number;
  instructorId: number;
  fichaId: number;
  classroom?: string;
  trimester: string;
}

class ScheduleService {
    async createTrimesterSchedule(data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    competenceId: number;
    instructorId: number;
    fichaId: number;
    classroom?: string;
    trimester: string;
  }) {
    try {
      const response = await api.post('/trimester-schedules', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear horario de trimestre:', error);
      throw error;
    }
  }

  // ⭐ AGREGAR MÉTODO PARA ELIMINAR
  async deleteTrimesterSchedule(scheduleId: number) {
    try {
      const response = await api.delete(`/trimester-schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar horario de trimestre:', error);
      throw error;
    }
  }
  async getInstructorsWithCompetences() {
    try {
      // ⭐ CAMBIAR RUTA - AGREGAR /users/
      const response = await api.get('/users/instructors/with-competences');
      return response.data;
    } catch (error) {
      console.error('Error al obtener instructores con competencias:', error);
      throw error;
    }
  }

  async getTrimesterSchedule(fichaId: number, trimester: string) {
    try {
      const response = await api.get(`/trimester-schedules/ficha/${fichaId}`, {
        params: { trimester }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener horarios de trimestre:', error);
      throw error;
    }
  }

  async getFichasWithCompetences() {
    try {
      // ⭐ CAMBIAR RUTA - AGREGAR /users/
      const response = await api.get('/users/fichas/with-competences');
      return response.data;
    } catch (error) {
      console.error('Error al obtener fichas con competencias:', error);
      throw error;
    }
  }

  async getAllCompetences() {
    try {
      // ⭐ CAMBIAR RUTA - AGREGAR /users/
      const response = await api.get('/users/competences');
      return response.data;
    } catch (error) {
      console.error('Error al obtener competencias:', error);
      throw error;
    }
  }

  
}

export const scheduleService = new ScheduleService();
