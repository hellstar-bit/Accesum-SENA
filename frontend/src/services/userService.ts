// src/services/userService.ts
import api from './api';

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
    typeId: number;
    regionalId: number;
    centerId: number;
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
    typeId?: number;
    regionalId?: number;
    centerId?: number;
  };
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

export const userService = {
  async getUsers(page: number = 1, limit: number = 10): Promise<UsersResponse> {
    const response = await api.get<UsersResponse>(`/users?page=${page}&limit=${limit}`);
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
};