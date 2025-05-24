// frontend/src/services/dashboardService.ts
import api from './api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayAccess: number;
  totalProfiles: number;
  usersByType: {
    funcionarios: number;
    contratistas: number;
    aprendices: number;
    visitantes: number;
  };
}

export interface RecentActivity {
  id: number;
  user: string;
  type: string;
  time: string;
  exitTime?: string;
}

export interface UserGrowth {
  date: string;
  count: string;
}

export interface UsersByRole {
  role: string;
  count: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await api.get<RecentActivity[]>(`/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  },

  async getUserGrowth(): Promise<UserGrowth[]> {
    const response = await api.get<UserGrowth[]>('/dashboard/user-growth');
    return response.data;
  },

  async getUsersByRole(): Promise<UsersByRole[]> {
    const response = await api.get<UsersByRole[]>('/dashboard/users-by-role');
    return response.data;
  },
};