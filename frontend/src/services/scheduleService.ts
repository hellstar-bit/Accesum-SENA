// frontend/src/services/scheduleService.ts - COMPLETAMENTE CORREGIDO
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
      console.log('📡 Frontend: Creando horario de trimestre:', data);
      const response = await api.post('/trimester-schedules', data);
      console.log('✅ Frontend: Horario creado exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al crear horario de trimestre:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  }

  async deleteTrimesterSchedule(scheduleId: number) {
    try {
      console.log(`📡 Frontend: Eliminando horario ${scheduleId}`);
      const response = await api.delete(`/trimester-schedules/${scheduleId}`);
      console.log('✅ Frontend: Horario eliminado exitosamente');
      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al eliminar horario de trimestre:', error);
      throw error;
    }
  }

  async createCompetence(data: {
    code: string;
    name: string;
    description?: string;
    hours: number;
    programId: number;
    instructorIds: number[];
  }) {
    try {
      console.log('📡 Frontend: Creando competencia:', data);
      // ✅ RUTA CORREGIDA - usar /competences directamente
      const response = await api.post('/competences', data);
      console.log('✅ Frontend: Competencia creada exitosamente');
      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al crear competencia:', error);
      throw error;
    }
  }

  async getAllCompetences() {
    try {
      console.log('📡 Frontend: Obteniendo todas las competencias');
      // ✅ RUTA CORREGIDA - usar /competences directamente
      const response = await api.get('/competences');
      console.log('✅ Frontend: Competencias obtenidas');
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener competencias:', error);
      return [];
    }
  }

  async getTrimesterSchedule(fichaId: number, trimester: string) {
    try {
      console.log(`📡 Frontend: Obteniendo horarios para ficha ${fichaId}, trimestre ${trimester}`);
      const response = await api.get(`/trimester-schedules/ficha/${fichaId}`, {
        params: { trimester }
      });
      console.log('✅ Frontend: Horarios de trimestre obtenidos');
      return response.data;
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener horarios de trimestre:', error);
      // Retornar estructura vacía en caso de error
      return {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };
    }
  }

  // ✅ NUEVO MÉTODO - Obtener instructores con competencias
  async getInstructorsWithCompetences() {
    try {
      console.log('📡 Frontend: Obteniendo instructores con competencias');
      
      // Obtener usuarios con rol de instructor
      const usersResponse = await api.get('/users');
      const allUsers = usersResponse.data?.data || usersResponse.data || [];
      
      // Filtrar solo instructores
      const instructors = allUsers.filter((user: any) => 
        user.role?.name === 'Instructor' && user.isActive
      );

      // Obtener competencias para mapear
      const competencesResponse = await api.get('/competences');
      const allCompetences = competencesResponse.data?.data || competencesResponse.data || [];

      // Formatear instructores con sus competencias
      const instructorsWithCompetences = instructors.map((instructor: any) => ({
        id: instructor.id,
        name: instructor.profile 
          ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
          : instructor.email,
        email: instructor.email,
        competences: instructor.competences || allCompetences, // Por ahora, todos los instructores pueden enseñar todas las competencias
        assignments: [] // Implementar si necesitas asignaciones específicas
      }));

      console.log(`✅ Frontend: ${instructorsWithCompetences.length} instructores obtenidos`);
      return instructorsWithCompetences;
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener instructores con competencias:', error);
      return [];
    }
  }

  // ✅ NUEVO MÉTODO - Obtener fichas con competencias
  async getFichasWithCompetences() {
    try {
      console.log('📡 Frontend: Obteniendo fichas con competencias');
      
      // Obtener todas las fichas
      const fichasResponse = await api.get('/config/fichas');
      const allFichas = fichasResponse.data?.data || fichasResponse.data || [];

      // Para cada ficha, obtener sus competencias asignadas
      const fichasWithCompetences = await Promise.all(
        allFichas.map(async (ficha: any) => {
          try {
            const competencesResponse = await api.get(`/ficha-competences/ficha/${ficha.id}`);
            const fichaCompetences = competencesResponse.data?.data || competencesResponse.data || [];
            
            const competences = fichaCompetences.map((fc: any) => fc.competence);
            
            return {
              id: ficha.id,
              code: ficha.code,
              name: ficha.name,
              status: ficha.status,
              programId: ficha.programId,
              competences: competences,
              program: ficha.program
            };
          } catch (error) {
            console.error(`Error al obtener competencias para ficha ${ficha.id}:`, error);
            return {
              id: ficha.id,
              code: ficha.code,
              name: ficha.name,
              status: ficha.status,
              programId: ficha.programId,
              competences: [],
              program: ficha.program
            };
          }
        })
      );

      console.log(`✅ Frontend: ${fichasWithCompetences.length} fichas con competencias obtenidas`);
      return fichasWithCompetences;
    } catch (error: any) {
      console.error('❌ Frontend: Error al obtener fichas con competencias:', error);
      return [];
    }
  }

  // ✅ MÉTODO DE DEBUG
  async debugScheduleCreation(data: any) {
    try {
      console.log('🔍 Frontend: DEBUG - Datos para crear horario:', data);
      
      // Verificar competencia
      const competenceResponse = await api.get(`/competences/debug/${data.competenceId}`);
      console.log('🔍 Frontend: Competencia encontrada:', competenceResponse.data);
      
      // Verificar instructor
      const userResponse = await api.get(`/users/${data.instructorId}`);
      console.log('🔍 Frontend: Instructor encontrado:', userResponse.data);
      
      // Verificar ficha
      const fichaResponse = await api.get(`/config/fichas/${data.fichaId}`);
      console.log('🔍 Frontend: Ficha encontrada:', fichaResponse.data);
      
      return {
        competence: competenceResponse.data,
        instructor: userResponse.data,
        ficha: fichaResponse.data
      };
    } catch (error) {
      console.error('🔍 Frontend: Error en debug:', error);
      return null;
    }
  }
}

export const scheduleService = new ScheduleService();