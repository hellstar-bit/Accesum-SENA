// frontend/src/services/userService.ts - Optimizado para búsqueda en vivo
import api from './api';

// ============= INTERFACES =============
export type { Role } from '../types/user.types';

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

export interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  typeId?: number;
  fichaId?: number;
  regionalId?: number;
  centerId?: number;
  page?: number; // ⭐ AGREGADO
  limit?: number; // ⭐ AGREGADO
}

export interface UsersResponse {
  users: User[]; // ⭐ CORREGIDO: debe ser User[] no any
  data: User[];
  total: number;
  count: number; // ⭐ AGREGADO
  page: number;
  limit: number;
  totalPages: number;
  // ⭐ MANTENER filter para compatibilidad
  filter(arg0: (user: { role: { name: string; }; }) => boolean): User[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{
    role: string;
    count: string;
  }>;
  learnersByFicha?: Array<{
    fichaCode: string;
    fichaName: string;
    count: string;
  }>;
}

// ============= CONTROLADOR DE CANCELACIÓN =============

// Para cancelar peticiones pendientes y evitar conflictos
class RequestController {
  private controllers = new Map<string, AbortController>();

  createController(key: string): AbortController {
    // Cancelar petición anterior si existe
    this.cancelRequest(key);
    
    // Crear nuevo controlador
    const controller = new AbortController();
    this.controllers.set(key, controller);
    
    return controller;
  }

  cancelRequest(key: string): void {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  cleanup(key: string): void {
    this.controllers.delete(key);
  }
}

const requestController = new RequestController();

// ============= SERVICIO OPTIMIZADO =============

export const userService = {
  // ========== USUARIOS CON CANCELACIÓN DE PETICIONES ==========
  
  // ⭐ MÉTODO CORREGIDO CON TODAS LAS PROPIEDADES NECESARIAS
  async getUsers(page = 1, limit = 10, filters: UserFilters = {}): Promise<UsersResponse> {
  try {
    const params = this.sanitizeFilters({ page, limit, ...filters });
    
    const response = await api.get('/users', { params });
    
    if (!response.data) {
      throw new Error('Respuesta vacía del servidor');
    }
    
    const users = response.data.users || response.data.data || [];
    const total = response.data.total || 0;
    const count = response.data.count || users.length;
    
    return {
      users,
      data: users,
      total,
      count,
      page: response.data.page || page,
      limit,
      totalPages: response.data.totalPages || Math.ceil(total / limit),
      filter: (predicate: (user: { role: { name: string; }; }) => boolean) => {
        return users.filter(predicate);
      }
    };
  } catch (error: any) {
    // ⭐ MANEJO MEJORADO de cancelaciones
    if (error.isCanceled || error.message === 'canceled' || error.code === 'ERR_CANCELED') {
      console.log('🚫 getUsers - Petición cancelada, retornando datos vacíos');
      return {
        users: [],
        data: [],
        total: 0,
        count: 0,
        page: 1,
        limit,
        totalPages: 1,
        filter: () => []
      };
    }
    
    // ⭐ MANEJO de timeouts
    if (error.isTimeout) {
      console.warn('⏱️ getUsers - Timeout, retornando datos vacíos');
      return {
        users: [],
        data: [],
        total: 0,
        count: 0,
        page: 1,
        limit,
        totalPages: 1,
        filter: () => []
      };
    }
    
    console.error('❌ Error real en getUsers:', error);
    throw error;
  }
},

  // ========== CANCELAR PETICIONES PENDIENTES ==========
  
  cancelAllRequests(): void {
    console.log('🚫 Cancelando todas las peticiones pendientes');
    requestController.cancelRequest('getUsers');
    requestController.cancelRequest('getFichas');
  },

  // ========== MÉTODOS OPTIMIZADOS ==========

  async getFichas(): Promise<Ficha[]> {
    const requestKey = 'getFichas';
    
    try {
      const controller = requestController.createController(requestKey);
      
      console.log('📡 getFichas - Obteniendo fichas...');
      
      const response = await api.get('/users/fichas', {
        signal: controller.signal
      });
      
      console.log('✅ getFichas - Respuesta recibida');
      
      requestController.cleanup(requestKey);
      
      // Manejar diferentes formatos de respuesta
      const fichasData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      if (!Array.isArray(fichasData)) {
        console.warn('⚠️ getFichas: respuesta no es un array:', fichasData);
        return [];
      }
      
      return fichasData;
      
    } catch (error: any) {
      requestController.cleanup(requestKey);
      
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🚫 getFichas - Petición cancelada');
        return [];
      }
      
      console.error('❌ getFichas - Error:', error);
      return [];
    }
  },

  async getUserById(id: number): Promise<User> {
    try {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ getUserById(${id}) - Error:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      throw new Error(error.response?.data?.message || 'Error al obtener usuario');
    }
  },

  async createUser(userData: any): Promise<User> {
    try {
      const response = await api.post<User>('/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('❌ createUser - Error:', error);
      
      if (error.response?.status === 409) {
        throw new Error('Email o documento ya está en uso');
      }
      
      throw new Error(error.response?.data?.message || 'Error al crear usuario');
    }
  },

  async updateUser(id: number, userData: any): Promise<User> {
    try {
      const response = await api.patch<User>(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error(`❌ updateUser(${id}) - Error:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      if (error.response?.status === 409) {
        throw new Error('Email ya está en uso por otro usuario');
      }
      
      throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ deleteUser(${id}) - Error:`, error);
      
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<UserStats>('/users/stats');
      return response.data;
    } catch (error: any) {
      console.error('❌ getUserStats - Error:', error);
      
      // Retornar datos por defecto en caso de error
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: [],
        learnersByFicha: [],
      };
    }
  },

  // ========== MÉTODOS DE BÚSQUEDA OPTIMIZADOS ==========

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) {
      return [];
    }
    
    try {
      const response = await this.getUsers(1, 50, { search: query.trim() });
      return response.data;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return [];
      }
      throw error;
    }
  },

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const response = await this.getUsers(1, 100, { role });
      return response.data;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return [];
      }
      throw error;
    }
  },

  async getLearnersByFicha(fichaId: number): Promise<User[]> {
    try {
      const response = await this.getUsers(1, 100, { 
        role: 'Aprendiz', 
        fichaId 
      });
      return response.data;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return [];
      }
      throw error;
    }
  },

  async getActiveUsers(): Promise<User[]> {
    try {
      const response = await this.getUsers(1, 100, { status: 'active' });
      return response.data;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return [];
      }
      throw error;
    }
  },

  async getInactiveUsers(): Promise<User[]> {
    try {
      const response = await this.getUsers(1, 100, { status: 'inactive' });
      return response.data;
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        return [];
      }
      throw error;
    }
  },

  // ========== UTILIDADES CON MANEJO DE ERRORES MEJORADO ==========

  async getFichaStats(fichaId: number): Promise<{
    totalLearners: number;
    activeLearners: number;
    inactiveLearners: number;
    learnersWithQR: number;
    learnersWithoutQR: number;
  }> {
    try {
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
    } catch (error: any) {
      console.error(`❌ getFichaStats(${fichaId}) - Error:`, error);
      
      return {
        totalLearners: 0,
        activeLearners: 0,
        inactiveLearners: 0,
        learnersWithQR: 0,
        learnersWithoutQR: 0,
      };
    }
  },

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
    } catch (error: any) {
      console.error(`❌ validateFicha(${fichaId}) - Error:`, error);
      
      return {
        exists: false,
        hasLearners: false,
        learnerCount: 0,
      };
    }
  },

  async getFichaWithLearners(fichaId: number): Promise<{
    ficha: Ficha;
    learners: User[];
    stats: {
      total: number;
      active: number;
      withQR: number;
    };
  }> {
    try {
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
    } catch (error: any) {
      console.error(`❌ getFichaWithLearners(${fichaId}) - Error:`, error);
      throw error;
    }
  },

  async getFichasWithLearners(): Promise<Array<{
    ficha: Ficha;
    learnersCount: number;
  }>> {
    try {
      const fichas = await this.getFichas();
      const results = [];

      // Usar Promise.allSettled para manejar errores individuales
      const learnerPromises = fichas.map(ficha => this.getLearnersByFicha(ficha.id));
      const learnerResults = await Promise.allSettled(learnerPromises);

      for (let i = 0; i < fichas.length; i++) {
        const learnerResult = learnerResults[i];
        const learners = learnerResult.status === 'fulfilled' ? learnerResult.value : [];
        
        results.push({
          ficha: fichas[i],
          learnersCount: learners.length
        });
      }

      return results;
    } catch (error: any) {
      console.error('❌ getFichasWithLearners - Error:', error);
      return [];
    }
  },

  // ========== MÉTODO DE IMPORTACIÓN ==========
  
  async importFromExcel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para imports grandes
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ importFromExcel - Error:', error);
      
      if (error.response?.status === 413) {
        throw new Error('El archivo es demasiado grande');
      }
      
      if (error.response?.status === 422) {
        throw new Error('Formato de archivo inválido');
      }
      
      throw new Error(error.response?.data?.message || 'Error al importar archivo');
    }
  },

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Reinicia el estado del servicio - útil para limpiar cuando se cierra la página
   */
  cleanup(): void {
    this.cancelAllRequests();
  },

  /**
   * Verifica si una búsqueda es válida
   */
  isValidSearch(search: string): boolean {
    return Boolean(search) && search.trim().length >= 1;
  },

  /**
   * Sanitiza los filtros antes de enviarlos
   */
  sanitizeFilters(filters: UserFilters): UserFilters {
    const sanitized: UserFilters = {};
    
    if (filters.search && this.isValidSearch(filters.search)) {
      sanitized.search = filters.search.trim();
    }
    
    if (filters.role) {
      sanitized.role = filters.role;
    }
    
    if (filters.status && (filters.status === 'active' || filters.status === 'inactive')) {
      sanitized.status = filters.status;
    }
    
    if (filters.typeId && !isNaN(Number(filters.typeId))) {
      sanitized.typeId = Number(filters.typeId);
    }
    
    if (filters.fichaId && !isNaN(Number(filters.fichaId))) {
      sanitized.fichaId = Number(filters.fichaId);
    }
    
    if (filters.regionalId && !isNaN(Number(filters.regionalId))) {
      sanitized.regionalId = Number(filters.regionalId);
    }
    
    if (filters.centerId && !isNaN(Number(filters.centerId))) {
      sanitized.centerId = Number(filters.centerId);
    }
    
    // ⭐ AGREGAR page y limit al sanitizado
    if (filters.page && !isNaN(Number(filters.page))) {
      sanitized.page = Number(filters.page);
    }
    
    if (filters.limit && !isNaN(Number(filters.limit))) {
      sanitized.limit = Number(filters.limit);
    }
    
    return sanitized;
  }
};
