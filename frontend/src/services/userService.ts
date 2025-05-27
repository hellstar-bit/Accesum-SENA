// frontend/src/services/userService.ts - Versión Unificada
import api from './api';

// ============= INTERFACES UNIFICADAS =============

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
    learnerStatus?: string; // Para aprendices
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

export interface CreateUserRequest {
  email: string;
  password: string;
  roleId: number;
  profile: {
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
    typeId: number;
    regionalId: number;
    centerId: number;
    coordinationId?: number;
    programId?: number;
    fichaId?: number;
  };
}

export interface UpdateUserRequest {
  email?: string;
  roleId?: number;
  isActive?: boolean;
  profile?: {
    documentType?: string;
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bloodType?: string;
    address?: string;
    city?: string;
    maritalStatus?: string;
    sex?: string;
    vaccine?: string;
    typeId?: number;
    regionalId?: number;
    centerId?: number;
    coordinationId?: number;
    programId?: number;
    fichaId?: number;
  };
}

export interface UpdateProfileRequest {
  documentType?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bloodType?: string;
  address?: string;
  city?: string;
  maritalStatus?: string;
  sex?: string;
  vaccine?: string;
  typeId?: number;
  regionalId?: number;
  centerId?: number;
  coordinationId?: number;
  programId?: number;
  fichaId?: number;
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
}

export interface ProfileStats {
  totalProfiles: number;
  profilesByType: Array<{ 
    typeName: string; 
    count: string 
  }>;
  profilesByRegional: Array<{ 
    regionalName: string; 
    count: string 
  }>;
  profilesWithQR: number;
  profilesWithoutQR: number;
}

// ============= SERVICIO UNIFICADO =============

export const userService = {
  // ========== USUARIOS ==========
  
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get<UsersResponse>(`/users?${params}`);
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
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

  // ========== PERFILES ==========

  async getProfileById(id: number): Promise<User> {
    const response = await api.get<User>(`/profiles/${id}`);
    return response.data;
  },

  async getProfileByUserId(userId: number): Promise<User> {
    const response = await api.get<User>(`/profiles/user/${userId}`);
    return response.data;
  },

  async updateProfile(id: number, data: UpdateProfileRequest): Promise<User> {
    const response = await api.patch<User>(`/profiles/${id}`, data);
    return response.data;
  },

  async regenerateQR(profileId: number): Promise<User> {
    const response = await api.post<User>(`/profiles/${profileId}/regenerate-qr`);
    return response.data;
  },

  async uploadProfileImage(profileId: number, imageBase64: string): Promise<User> {
    const response = await api.post<User>(`/profiles/${profileId}/upload-image`, {
      image: imageBase64,
    });
    return response.data;
  },

  async getProfileStats(): Promise<ProfileStats> {
    const response = await api.get<ProfileStats>('/profiles/stats');
    return response.data;
  },

  // ========== IMPORTACIÓN ==========

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

  async importLearnersWithForm(file: File, fichaData: {
    codigo: string;
    nombre: string;
    estado: string;
    fecha: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fichaData', JSON.stringify(fichaData));

    const response = await api.post('/import/learners-with-form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // ========== BÚSQUEDA Y FILTROS ==========

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?search=${encodeURIComponent(query)}&limit=50`);
    return response.data.data;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?role=${role}&limit=100`);
    return response.data.data;
  },

  async getUsersByType(typeId: number): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?typeId=${typeId}&limit=100`);
    return response.data.data;
  },

  async getActiveUsers(): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?status=active&limit=100`);
    return response.data.data;
  },

  async getInactiveUsers(): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?status=inactive&limit=100`);
    return response.data.data;
  },

  async getUsersWithoutQR(): Promise<User[]> {
    const response = await api.get<UsersResponse>(`/users?qr=false&limit=100`);
    return response.data.data;
  },

  // ========== OPERACIONES MASIVAS ==========

  async bulkUpdateUsers(userIds: number[], updates: Partial<UpdateUserRequest>): Promise<{ updated: number }> {
    const response = await api.patch('/users/bulk', { userIds, updates });
    return response.data;
  },

  async bulkGenerateQR(profileIds: number[]): Promise<{ generated: number }> {
    const response = await api.post('/profiles/bulk-qr', { profileIds });
    return response.data;
  },

  async exportUsers(filters?: {
    role?: string;
    type?: string;
    status?: string;
    regional?: string;
    center?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await api.get(`/users/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ========== VALIDACIONES ==========

  async validateEmail(email: string, excludeUserId?: number): Promise<{ isValid: boolean; message?: string }> {
    const params = new URLSearchParams({ email });
    if (excludeUserId) {
      params.append('excludeUserId', excludeUserId.toString());
    }

    const response = await api.get(`/users/validate-email?${params}`);
    return response.data;
  },

  async validateDocument(documentNumber: string, excludeProfileId?: number): Promise<{ isValid: boolean; message?: string }> {
    const params = new URLSearchParams({ documentNumber });
    if (excludeProfileId) {
      params.append('excludeProfileId', excludeProfileId.toString());
    }

    const response = await api.get(`/profiles/validate-document?${params}`);
    return response.data;
  },

  // ========== REPORTES ==========

  async getUsersReport(filters?: {
    startDate?: string;
    endDate?: string;
    role?: string;
    type?: string;
    regional?: string;
    center?: string;
  }): Promise<{
    summary: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      usersWithQR: number;
      usersWithoutQR: number;
    };
    data: User[];
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await api.get(`/users/report?${params}`);
    return response.data;
  },

  async getProfilesReport(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    regional?: string;
    center?: string;
    hasQR?: boolean;
    hasPhoto?: boolean;
  }): Promise<{
    summary: ProfileStats;
    data: User[];
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    const response = await api.get(`/profiles/report?${params}`);
    return response.data;
  },

  // ========== FUNCIONES DE UTILIDAD ==========

  /**
   * Obtiene el nombre completo de un usuario
   */
  getFullName(user: User): string {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  },

  /**
   * Obtiene el documento completo de un usuario
   */
  getFullDocument(user: User): string {
    return `${user.profile.documentType} ${user.profile.documentNumber}`;
  },

  /**
   * Verifica si un usuario tiene código QR
   */
  hasQRCode(user: User): boolean {
    return !!user.profile.qrCode;
  },

  /**
   * Verifica si un usuario tiene foto de perfil
   */
  hasProfileImage(user: User): boolean {
    return !!user.profile.profileImage;
  },

  /**
   * Obtiene el estado de completitud del perfil
   */
  getProfileCompleteness(user: User): {
    percentage: number;
    missingFields: string[];
    isComplete: boolean;
  } {
    const requiredFields = [
      { key: 'firstName', label: 'Nombres' },
      { key: 'lastName', label: 'Apellidos' },
      { key: 'documentType', label: 'Tipo de documento' },
      { key: 'documentNumber', label: 'Número de documento' },
      { key: 'phoneNumber', label: 'Teléfono' },
      { key: 'profileImage', label: 'Foto de perfil' },
      { key: 'qrCode', label: 'Código QR' },
    ];

    const missingFields: string[] = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = user.profile[field.key as keyof typeof user.profile];
      if (value && value.toString().trim() !== '') {
        completedFields++;
      } else {
        missingFields.push(field.label);
      }
    });

    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    const isComplete = percentage === 100;

    return {
      percentage,
      missingFields,
      isComplete,
    };
  },

  /**
   * Filtra usuarios por múltiples criterios
   */
  filterUsers(users: User[], filters: {
    search?: string;
    role?: string;
    type?: string;
    status?: 'active' | 'inactive';
    hasQR?: boolean;
    hasPhoto?: boolean;
    regional?: string;
    center?: string;
  }): User[] {
    return users.filter(user => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          user.profile.firstName.toLowerCase().includes(searchLower) ||
          user.profile.lastName.toLowerCase().includes(searchLower) ||
          user.profile.documentNumber.includes(filters.search) ||
          user.email.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de rol
      if (filters.role && user.role.name !== filters.role) {
        return false;
      }

      // Filtro de tipo
      if (filters.type && user.profile.type.name !== filters.type) {
        return false;
      }

      // Filtro de estado
      if (filters.status) {
        if (filters.status === 'active' && !user.isActive) return false;
        if (filters.status === 'inactive' && user.isActive) return false;
      }

      // Filtro de QR
      if (filters.hasQR !== undefined) {
        if (filters.hasQR && !user.profile.qrCode) return false;
        if (!filters.hasQR && user.profile.qrCode) return false;
      }

      // Filtro de foto
      if (filters.hasPhoto !== undefined) {
        if (filters.hasPhoto && !user.profile.profileImage) return false;
        if (!filters.hasPhoto && user.profile.profileImage) return false;
      }

      // Filtro de regional
      if (filters.regional && user.profile.regional.name !== filters.regional) {
        return false;
      }

      // Filtro de centro
      if (filters.center && user.profile.center.name !== filters.center) {
        return false;
      }

      return true;
    });
  },

  /**
   * Agrupa usuarios por un campo específico
   */
  groupUsersBy(users: User[], field: 'role' | 'type' | 'regional' | 'center' | 'status'): Record<string, User[]> {
    return users.reduce((groups, user) => {
      let key: string;
      
      switch (field) {
        case 'role':
          key = user.role.name;
          break;
        case 'type':
          key = user.profile.type.name;
          break;
        case 'regional':
          key = user.profile.regional.name;
          break;
        case 'center':
          key = user.profile.center.name;
          break;
        case 'status':
          key = user.isActive ? 'Activo' : 'Inactivo';
          break;
        default:
          key = 'Sin categoría';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(user);
      
      return groups;
    }, {} as Record<string, User[]>);
  },

  /**
   * Ordena usuarios por un campo específico
   */
  sortUsers(users: User[], field: 'name' | 'email' | 'role' | 'type' | 'document' | 'createdAt', direction: 'asc' | 'desc' = 'asc'): User[] {
    return [...users].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case 'name':
          aValue = `${a.profile.firstName} ${a.profile.lastName}`;
          bValue = `${b.profile.firstName} ${b.profile.lastName}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role.name;
          bValue = b.role.name;
          break;
        case 'type':
          aValue = a.profile.type.name;
          bValue = b.profile.type.name;
          break;
        case 'document':
          aValue = a.profile.documentNumber;
          bValue = b.profile.documentNumber;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
};