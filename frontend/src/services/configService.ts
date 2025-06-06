// frontend/src/services/configService.ts - CON TIPOS EXPORTADOS
import api from './api';

// ⭐ EXPORTAR TIPOS/INTERFACES
export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface PersonnelType {
  id: number;
  name: string;
}

export interface Regional {
  id: number;
  name: string;
}

export interface Center {
  id: number;
  name: string;
  regional?: Regional;
}

export interface Coordination {
  id: number;
  name: string;
  center?: Center;
}

export interface Program {
  id: number;
  name: string;
  coordination?: Coordination;
}

export interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  program?: Program;
}

export interface Hierarchy {
  regionales: Regional[];
  centers: Center[];
  coordinations: Coordination[];
  programs: Program[];
  fichas: Ficha[];
  roles: Role[];
  personnelTypes: PersonnelType[];
}

class ConfigService {
  // ⭐ REGIONALES
  async getRegionales(): Promise<Regional[]> {
    const response = await api.get('/config/regionales');
    return response.data;
  }

  async createRegional(data: { name: string }): Promise<Regional> {
    const response = await api.post('/config/regionales', data);
    return response.data;
  }

  async updateRegional(id: number, data: { name: string }): Promise<Regional> {
    const response = await api.put(`/config/regionales/${id}`, data);
    return response.data;
  }

  async deleteRegional(id: number): Promise<void> {
    await api.delete(`/config/regionales/${id}`);
  }

  // ⭐ CENTROS
  async getCenters(): Promise<Center[]> {
    const response = await api.get('/config/centers');
    return response.data;
  }

  async createCenter(data: { name: string; regionalId: number }): Promise<Center> {
    const response = await api.post('/config/centers', data);
    return response.data;
  }

  async updateCenter(id: number, data: { name?: string; regionalId?: number }): Promise<Center> {
    const response = await api.put(`/config/centers/${id}`, data);
    return response.data;
  }

  async deleteCenter(id: number): Promise<void> {
    await api.delete(`/config/centers/${id}`);
  }

  // ⭐ COORDINACIONES
  async getCoordinations(): Promise<Coordination[]> {
    const response = await api.get('/config/coordinations');
    return response.data;
  }

  async getCoordinationsByCenter(centerId: number): Promise<Coordination[]> {
    const response = await api.get(`/config/centers/${centerId}/coordinations`);
    return response.data;
  }

  async createCoordination(data: { name: string; centerId: number }): Promise<Coordination> {
    const response = await api.post('/config/coordinations', data);
    return response.data;
  }

  async updateCoordination(id: number, data: { name?: string; centerId?: number }): Promise<Coordination> {
    const response = await api.put(`/config/coordinations/${id}`, data);
    return response.data;
  }

  async deleteCoordination(id: number): Promise<void> {
    await api.delete(`/config/coordinations/${id}`);
  }

  // ⭐ PROGRAMAS
  async getPrograms(): Promise<Program[]> {
    const response = await api.get('/config/programs');
    return response.data;
  }

  async createProgram(data: { name: string; coordinationId: number }): Promise<Program> {
    const response = await api.post('/config/programs', data);
    return response.data;
  }

  async updateProgram(id: number, data: { name?: string; coordinationId?: number }): Promise<Program> {
    const response = await api.put(`/config/programs/${id}`, data);
    return response.data;
  }

  async deleteProgram(id: number): Promise<void> {
    await api.delete(`/config/programs/${id}`);
  }

  // ⭐ FICHAS
  async getFichas(): Promise<Ficha[]> {
    const response = await api.get('/config/fichas');
    return response.data;
  }

  async createFicha(data: { 
    code: string; 
    name: string; 
    programId: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Ficha> {
    const response = await api.post('/config/fichas', data);
    return response.data;
  }

  async updateFicha(id: number, data: { 
    code?: string; 
    name?: string; 
    programId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Ficha> {
    const response = await api.put(`/config/fichas/${id}`, data);
    return response.data;
  }

  async deleteFicha(id: number): Promise<void> {
    await api.delete(`/config/fichas/${id}`);
  }

  // ⭐ ROLES
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/config/roles');
    return response.data;
  }

  async createRole(data: { name: string; description?: string }): Promise<Role> {
    const response = await api.post('/config/roles', data);
    return response.data;
  }

  async updateRole(id: number, data: { name?: string; description?: string }): Promise<Role> {
    const response = await api.put(`/config/roles/${id}`, data);
    return response.data;
  }

  async deleteRole(id: number): Promise<void> {
    await api.delete(`/config/roles/${id}`);
  }

  // ⭐ TIPOS DE PERSONAL
  async getPersonnelTypes(): Promise<PersonnelType[]> {
    const response = await api.get('/config/personnel-types');
    return response.data;
  }

  async createPersonnelType(data: { name: string }): Promise<PersonnelType> {
    const response = await api.post('/config/personnel-types', data);
    return response.data;
  }

  async updatePersonnelType(id: number, data: { name: string }): Promise<PersonnelType> {
    const response = await api.put(`/config/personnel-types/${id}`, data);
    return response.data;
  }

  async deletePersonnelType(id: number): Promise<void> {
    await api.delete(`/config/personnel-types/${id}`);
  }

  // ⭐ JERARQUÍA COMPLETA
  async getHierarchy(): Promise<Hierarchy> {
    const response = await api.get('/config/hierarchy');
    return response.data;
  }
}

export const configService = new ConfigService();