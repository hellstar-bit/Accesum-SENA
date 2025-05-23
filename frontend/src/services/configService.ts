// src/services/configService.ts
import api from './api';

export interface Role {
  id: number;
  name: string;
  description: string;
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
  regionalId: number;
  regional?: Regional;
}

export interface Coordination {
  id: number;
  name: string;
  centerId: number;
}

export interface Program {
  id: number;
  name: string;
  coordinationId: number;
}

export const configService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/config/roles');
    return response.data;
  },

  async getPersonnelTypes(): Promise<PersonnelType[]> {
    const response = await api.get<PersonnelType[]>('/config/personnel-types');
    return response.data;
  },

  async getRegionales(): Promise<Regional[]> {
    const response = await api.get<Regional[]>('/config/regionales');
    return response.data;
  },

  async getCenters(): Promise<Center[]> {
    const response = await api.get<Center[]>('/config/centers');
    return response.data;
  },

  async getCentersByRegional(regionalId: number): Promise<Center[]> {
    const response = await api.get<Center[]>(`/config/centers/${regionalId}`);
    return response.data;
  },

  async getCoordinationsByCenter(centerId: number): Promise<Coordination[]> {
    const response = await api.get<Coordination[]>(`/config/coordinations/${centerId}`);
    return response.data;
  },

  async getProgramsByCoordination(coordinationId: number): Promise<Program[]> {
    const response = await api.get<Program[]>(`/config/programs/${coordinationId}`);
    return response.data;
  },
};