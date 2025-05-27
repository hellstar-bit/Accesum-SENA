// frontend/src/services/userService.ts - Actualizado con filtro por ficha
import api from './api';

// ============= INTERFACES ACTUALIZADAS =============

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  profile: {
    id: number;
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    bloodType?: string;
    address?: string;
    city?: string;
    maritalStatus?: string;
    sex?: string;
    vaccine?: string;
    profileImage?: string;
    qrCode?: string;
    learnerStatus?: string;
    type: {
      id: number;
      name: string;
    };
    regional: {
      id: number;
      name: string;
    };
    center: {
      id: number;
      name: string;
    };
    coordination?: {
      id: number;
      name: string;
    };
    program?: {
      id: number;
      name: string;
    };
    ficha?: {
      id: number;
      code: string;
      name: string;
      status: string;
    };
  };
}

// ⭐ NUEVA INTERFAZ PARA FICHA
export interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
}

// ⭐ ACTUALIZAR FILTROS
export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  typeId?: number;
  fichaId?: number; // ⭐ NUEVO FILTRO
  regionalId?: number;
  centerId?: number;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{
    role: string;
    count: string;
  }>;
  learnersByFicha?: Array<{ // ⭐ NUEVA ESTADÍSTICA
    fichaCode: string;
    fichaName: string;
    count: string;
  }>;
}

// ============= SERVICIO ACTUALIZADO =============

export const userService = {
  // ========== USUARIOS CON FILTROS MEJORADOS ==========
  
  async getUsers(
    page: number = 1, 
    limit: number = 10, 
    filters?: UserFilters
  ): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<UsersResponse>(`/users?${params}`);
    return response.data;
  },

  // ⭐ NUEVO MÉTODO - Obtener fichas para filtros
  async getFichas(): Promise<Ficha[]> {
    const response = await api.get<Ficha[]>('/users/fichas');
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: any): Promise<User> {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  async updateUser(id: number, userData: any): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },

  // ========== MÉTODOS DE BÚSQUEDA ESPECÍFICOS ==========

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.getUsers(1, 50, { search: query });
    return response.data;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await this.getUsers(1, 100, { role });
    return response.data;
  },

  // ⭐ NUEVO MÉTODO - Obtener aprendices por ficha
  async getLearnersByFicha(fichaId: number): Promise<User[]> {
    const response = await this.getUsers(1, 100, { 
      role: 'Aprendiz', 
      fichaId 
    });
    return response.data;
  },

  // ⭐ NUEVO MÉTODO - Obtener todas las fichas con aprendices
  async getFichasWithLearners(): Promise<Array<{
    ficha: Ficha;
    learnersCount: number;
  }>> {
    const fichas = await this.getFichas();
    const results = [];

    for (const ficha of fichas) {
      const learners = await this.getLearnersByFicha(ficha.id);
      results.push({
        ficha,
        learnersCount: learners.length
      });
    }

    return results;
  },

  async getActiveUsers(): Promise<User[]> {
    const response = await this.getUsers(1, 100, { status: 'active' });
    return response.data;
  },

  async getInactiveUsers(): Promise<User[]> {
    const response = await this.getUsers(1, 100, { status: 'inactive' });
    return response.data;
  },

  // ========== UTILIDADES ESPECÍFICAS PARA FICHAS ==========

  /**
   * Obtiene estadísticas de una ficha específica
   */
  async getFichaStats(fichaId: number): Promise<{
    totalLearners: number;
    activeLearners: number;
    inactiveLearners: number;
    learnersWithQR: number;
    learnersWithoutQR: number;
  }> {
    const learners = await this.getLearnersByFicha(fichaId);
    
    const activeLearners = learners.filter(l => l.isActive).length;
    const learnersWithQR = learners.filter(l => l.profile.qrCode).length;
    
    return {
      totalLearners: learners.length,
      activeLearners,
      inactiveLearners: learners.length - activeLearners,
      learnersWithQR,
      learnersWithoutQR: learners.length - learnersWithQR,
    };
  },

  /**
   * Verifica si una ficha existe y tiene aprendices
   */
  async validateFicha(fichaId: number): Promise<{
    exists: boolean;
    hasLearners: boolean;
    learnerCount: number;
  }> {
    try {
      const learners = await this.getLearnersByFicha(fichaId);
      return {
        exists: true,
        hasLearners: learners.length > 0,
        learnerCount: learners.length,
      };
    } catch {
      return {
        exists: false,
        hasLearners: false,
        learnerCount: 0,
      };
    }
  },

  /**
   * Obtiene la información completa de una ficha con sus aprendices
   */
  async getFichaWithLearners(fichaId: number): Promise<{
    ficha: Ficha;
    learners: User[];
    stats: {
      total: number;
      active: number;
      withQR: number;
    };
  }> {
    const [fichas, learners] = await Promise.all([
      this.getFichas(),
      this.getLearnersByFicha(fichaId)
    ]);

    const ficha = fichas.find(f => f.id === fichaId);
    if (!ficha) {
      throw new Error('Ficha no encontrada');
    }

    const active = learners.filter(l => l.isActive).length;
    const withQR = learners.filter(l => l.profile.qrCode).length;

    return {
      ficha,
      learners,
      stats: {
        total: learners.length,
        active,
        withQR,
      },
    };
  },

  // ========== MÉTODOS EXISTENTES (mantener compatibilidad) ==========
  
  async importFromExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Otros métodos existentes...
};