// frontend/src/services/configService.ts
import api from './api';

// Reemplazar el archivo existente con esta versión expandida

// ================================
// TYPES & INTERFACES
// ================================
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
  users?: any[];
}

export interface PersonnelType {
  id: number;
  name: string;
  profiles?: any[];
}

export interface Regional {
  id: number;
  name: string;
  centers?: Center[];
  profiles?: any[];
}

export interface Center {
  id: number;
  name: string;
  regionalId: number;
  regional?: Regional;
  coordinations?: Coordination[];
  profiles?: any[];
}

export interface Coordination {
  id: number;
  name: string;
  centerId: number;
  center?: Center;
  programs?: Program[];
  profiles?: any[];
}

export interface Program {
  id: number;
  name: string;
  coordinationId: number;
  coordination?: Coordination;
  fichas?: any[];
  profiles?: any[];
}

// DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string;
}

export interface CreatePersonnelTypeDto {
  name: string;
}

export interface UpdatePersonnelTypeDto {
  name?: string;
}

export interface CreateRegionalDto {
  name: string;
}

export interface UpdateRegionalDto {
  name?: string;
}

export interface CreateCenterDto {
  name: string;
  regionalId: number;
}

export interface UpdateCenterDto {
  name?: string;
  regionalId?: number;
}

export interface CreateCoordinationDto {
  name: string;
  centerId: number;
}

export interface UpdateCoordinationDto {
  name?: string;
  centerId?: number;
}

export interface CreateProgramDto {
  name: string;
  coordinationId: number;
}

export interface UpdateProgramDto {
  name?: string;
  coordinationId?: number;
}

export const configService = {
  // ================================
  // ROLES
  // ================================
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/config/roles');
    return response.data;
  },

  async createRole(data: CreateRoleDto): Promise<Role> {
    const response = await api.post<Role>('/config/roles', data);
    return response.data;
  },

  async updateRole(id: number, data: UpdateRoleDto): Promise<Role> {
    const response = await api.put<Role>(`/config/roles/${id}`, data);
    return response.data;
  },

  async deleteRole(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/roles/${id}`);
    return response.data;
  },

  // ================================
  // TIPOS DE PERSONAL
  // ================================
  async getPersonnelTypes(): Promise<PersonnelType[]> {
    const response = await api.get<PersonnelType[]>('/config/personnel-types');
    return response.data;
  },

  async createPersonnelType(data: CreatePersonnelTypeDto): Promise<PersonnelType> {
    const response = await api.post<PersonnelType>('/config/personnel-types', data);
    return response.data;
  },

  async updatePersonnelType(id: number, data: UpdatePersonnelTypeDto): Promise<PersonnelType> {
    const response = await api.put<PersonnelType>(`/config/personnel-types/${id}`, data);
    return response.data;
  },

  async deletePersonnelType(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/personnel-types/${id}`);
    return response.data;
  },

  // ================================
  // REGIONALES
  // ================================
  async getRegionales(): Promise<Regional[]> {
    const response = await api.get<Regional[]>('/config/regionales');
    return response.data;
  },

  async createRegional(data: CreateRegionalDto): Promise<Regional> {
    const response = await api.post<Regional>('/config/regionales', data);
    return response.data;
  },

  async updateRegional(id: number, data: UpdateRegionalDto): Promise<Regional> {
    const response = await api.put<Regional>(`/config/regionales/${id}`, data);
    return response.data;
  },

  async deleteRegional(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/regionales/${id}`);
    return response.data;
  },

  // ================================
  // CENTROS
  // ================================
  async getCenters(): Promise<Center[]> {
    const response = await api.get<Center[]>('/config/centers');
    return response.data;
  },

  async getCentersByRegional(regionalId: number): Promise<Center[]> {
    const response = await api.get<Center[]>(`/config/centers/${regionalId}`);
    return response.data;
  },

  async createCenter(data: CreateCenterDto): Promise<Center> {
    const response = await api.post<Center>('/config/centers', data);
    return response.data;
  },

  async updateCenter(id: number, data: UpdateCenterDto): Promise<Center> {
    const response = await api.put<Center>(`/config/centers/${id}`, data);
    return response.data;
  },

  async deleteCenter(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/centers/${id}`);
    return response.data;
  },

  // ================================
  // COORDINACIONES
  // ================================
  async getCoordinationsByCenter(centerId: number): Promise<Coordination[]> {
    const response = await api.get<Coordination[]>(`/config/coordinations/${centerId}`);
    return response.data;
  },

  async createCoordination(data: CreateCoordinationDto): Promise<Coordination> {
    const response = await api.post<Coordination>('/config/coordinations', data);
    return response.data;
  },

  async updateCoordination(id: number, data: UpdateCoordinationDto): Promise<Coordination> {
    const response = await api.put<Coordination>(`/config/coordinations/${id}`, data);
    return response.data;
  },

  async deleteCoordination(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/coordinations/${id}`);
    return response.data;
  },

  // ================================
  // PROGRAMAS
  // ================================
  async getProgramsByCoordination(coordinationId: number): Promise<Program[]> {
    const response = await api.get<Program[]>(`/config/programs/${coordinationId}`);
    return response.data;
  },

  async createProgram(data: CreateProgramDto): Promise<Program> {
    const response = await api.post<Program>('/config/programs', data);
    return response.data;
  },

  async updateProgram(id: number, data: UpdateProgramDto): Promise<Program> {
    const response = await api.put<Program>(`/config/programs/${id}`, data);
    return response.data;
  },

  async deleteProgram(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/config/programs/${id}`);
    return response.data;
  },

  // ================================
  // UTILIDADES
  // ================================
  async getHierarchy(): Promise<{
    regionales: Regional[];
    centers: Center[];
    coordinations: Coordination[];
    programs: Program[];
  }> {
    const [regionales, centers] = await Promise.all([
      this.getRegionales(),
      this.getCenters(),
    ]);

    // Obtener todas las coordinaciones y programas
    const coordinationsPromises = centers.map(center => 
      this.getCoordinationsByCenter(center.id).catch(() => [])
    );
    const coordinationsArrays = await Promise.all(coordinationsPromises);
    const coordinations = coordinationsArrays.flat();

    const programsPromises = coordinations.map(coordination => 
      this.getProgramsByCoordination(coordination.id).catch(() => [])
    );
    const programsArrays = await Promise.all(programsPromises);
    const programs = programsArrays.flat();

    return {
      regionales,
      centers,
      coordinations,
      programs,
    };
  },
};