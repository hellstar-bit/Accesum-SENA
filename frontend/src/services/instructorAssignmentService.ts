import api from './api';

export interface InstructorAssignment {
  id: number;
  instructorId: number;
  fichaId: number;
  subject: string;
  description?: string;
  isActive: boolean;
  assignedAt: string;
  instructor: {
    id: number;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  ficha: {
    id: number;
    code: string;
    name: string;
    status: string;
  };
}

class InstructorAssignmentService {
  async getInstructorFichas(instructorId?: number): Promise<InstructorAssignment[]> {
    try {
      const endpoint = instructorId 
        ? `/instructor-assignments/instructor/${instructorId}/fichas`
        : '/instructor-assignments/my-fichas';
      
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error al obtener fichas del instructor:', error);
      throw error;
    }
  }

  async assignInstructorToFicha(data: {
    instructorId: number;
    fichaId: number;
    subject: string;
    description?: string;
  }): Promise<InstructorAssignment> {
    try {
      const response = await api.post('/instructor-assignments', data);
      return response.data;
    } catch (error) {
      console.error('Error al asignar instructor a ficha:', error);
      throw error;
    }
  }

  async getAllAssignments(): Promise<InstructorAssignment[]> {
    try {
      const response = await api.get('/instructor-assignments');
      return response.data;
    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      throw error;
    }
  }

  async removeAssignment(assignmentId: number): Promise<void> {
    try {
      await api.delete(`/instructor-assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      throw error;
    }
  }

  async updateAssignment(assignmentId: number, data: {
    subject?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<InstructorAssignment> {
    try {
      const response = await api.put(`/instructor-assignments/${assignmentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      throw error;
    }
  }
}

export const instructorAssignmentService = new InstructorAssignmentService();
