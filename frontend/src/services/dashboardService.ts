// frontend/src/services/dashboardService.ts - COMPLETO PARA TODOS LOS ENDPOINTS
import api from './api';

// ===== INTERFACES =====
export interface DashboardFilters {
  timeRange?: '1d' | '7d' | '30d' | '90d';
  regionalId?: number;
  centerId?: number;
  personnelTypeId?: number;
}

export interface EnhancedDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  todayAccess: number;
  weeklyAccess: number;
  monthlyAccess: number;
  totalProfiles: number;
  profilesWithQR: number;
  averageAccessPerDay: number;
  peakHour: number;
  usersByType: {
    funcionarios: number;
    contratistas: number;
    aprendices: number;
    visitantes: number;
  };
  growthMetrics: {
    userGrowthWeekly: number;
    accessGrowthDaily: number;
    accessGrowthWeekly: number;
  };
}

export interface AccessTrendData {
  date: string;
  count: number;
  entries: number;
  exits: number;
}

export interface RegionalStatsData {
  regional: string;
  regionalId: number;
  users: number;
  active: number;
  todayAccess: number;
  weeklyGrowth: number;
}

export interface CenterStatsData {
  center: string;
  centerId: number;
  users: number;
  todayAccess: number;
  weeklyAccess: number;
  occupancyRate: number;
}

export interface UserTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  growth: number;
}

export interface RecentActivity {
  id: number;
  user: string;
  email?: string;
  type: string;
  time: string;
  exitTime?: string;
  center?: string;
  userType?: string;
  status?: string;
  duration?: string;
}

export interface DashboardAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
}

export interface QuickSummary {
  summary: {
    totalUsers: number;
    todayAccess: number;
    activeRate: string;
    growthRate: string;
  };
  todayTrend: number;
  recentActivity: RecentActivity[];
}

export interface RealtimeMetrics {
  currentHourAccess: number;
  status: string;
  lastUpdate: string;
  serverTime: string;
}

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

export interface UserGrowth {
  date: string;
  count: string;
}

export interface UsersByRole {
  role: string;
  count: string;
}

// ===== SERVICIO COMPLETO =====
export const dashboardService = {

  // ===== MÉTODOS PRINCIPALES =====

  async getEnhancedStats(filters: DashboardFilters = {}): Promise<EnhancedDashboardStats> {
    console.log('📊 Solicitando estadísticas mejoradas:', filters);
    
    const params = new URLSearchParams();
    if (filters.timeRange) params.append('timeRange', filters.timeRange);
    if (filters.regionalId) params.append('regionalId', filters.regionalId.toString());
    if (filters.centerId) params.append('centerId', filters.centerId.toString());
    if (filters.personnelTypeId) params.append('personnelTypeId', filters.personnelTypeId.toString());

    const response = await api.get<EnhancedDashboardStats>(`/dashboard/enhanced-stats?${params.toString()}`);
    console.log('✅ Estadísticas mejoradas recibidas');
    return response.data;
  },

  async getAccessTrends(filters: DashboardFilters = {}): Promise<AccessTrendData[]> {
    console.log('📈 Solicitando tendencias de acceso:', filters);
    
    const params = new URLSearchParams();
    if (filters.timeRange) params.append('timeRange', filters.timeRange);
    if (filters.regionalId) params.append('regionalId', filters.regionalId.toString());
    if (filters.centerId) params.append('centerId', filters.centerId.toString());

    const response = await api.get<AccessTrendData[]>(`/dashboard/access-trends?${params.toString()}`);
    console.log('✅ Tendencias de acceso recibidas:', response.data.length);
    return response.data;
  },

  async getRegionalStats(timeRange: string = '7d'): Promise<RegionalStatsData[]> {
    console.log('🌍 Solicitando estadísticas por regional');
    
    const params = new URLSearchParams({ timeRange });
    const response = await api.get<RegionalStatsData[]>(`/dashboard/regional-stats?${params.toString()}`);
    console.log('✅ Estadísticas regionales recibidas:', response.data.length);
    return response.data;
  },

  async getCenterStats(filters: DashboardFilters = {}): Promise<CenterStatsData[]> {
    console.log('🏢 Solicitando estadísticas por centro');
    
    const params = new URLSearchParams();
    if (filters.regionalId) params.append('regionalId', filters.regionalId.toString());
    
    const response = await api.get<CenterStatsData[]>(`/dashboard/center-stats?${params.toString()}`);
    console.log('✅ Estadísticas de centros recibidas:', response.data.length);
    return response.data;
  },

  async getUserTypeDistribution(filters: DashboardFilters = {}): Promise<UserTypeDistribution[]> {
    console.log('👥 Solicitando distribución por tipo de usuario');
    
    const params = new URLSearchParams();
    if (filters.regionalId) params.append('regionalId', filters.regionalId.toString());
    if (filters.centerId) params.append('centerId', filters.centerId.toString());

    const response = await api.get<UserTypeDistribution[]>(`/dashboard/user-type-distribution?${params.toString()}`);
    console.log('✅ Distribución por tipo recibida:', response.data.length);
    return response.data;
  },

  async getRecentActivityFiltered(limit: number = 10, filters: DashboardFilters = {}): Promise<RecentActivity[]> {
    console.log('🕐 Solicitando actividad reciente:', { limit, filters });
    
    const params = new URLSearchParams({ limit: limit.toString() });
    if (filters.regionalId) params.append('regionalId', filters.regionalId.toString());
    if (filters.centerId) params.append('centerId', filters.centerId.toString());

    const response = await api.get<RecentActivity[]>(`/dashboard/recent-activity?${params.toString()}`);
    console.log('✅ Actividad reciente recibida:', response.data.length);
    return response.data;
  },

  async getQuickSummary(regionalId?: number): Promise<QuickSummary> {
    console.log('⚡ Solicitando resumen rápido');
    
    const params = new URLSearchParams();
    if (regionalId) params.append('regionalId', regionalId.toString());
    
    const response = await api.get<QuickSummary>(`/dashboard/quick-summary?${params.toString()}`);
    console.log('✅ Resumen rápido recibido');
    return response.data;
  },

  async getDashboardAlerts(): Promise<DashboardAlert[]> {
    console.log('🚨 Solicitando alertas del dashboard');
    
    const response = await api.get<DashboardAlert[]>('/dashboard/alerts');
    console.log('✅ Alertas recibidas:', response.data.length);
    return response.data;
  },

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    console.log('⏱️ Solicitando métricas en tiempo real');
    
    const response = await api.get<RealtimeMetrics>('/dashboard/realtime');
    console.log('✅ Métricas en tiempo real recibidas');
    return response.data;
  },

  async exportDashboardData(timeRange: string = '30d', format: 'json' | 'csv' = 'json'): Promise<any> {
    console.log('📤 Exportando datos del dashboard');
    
    const params = new URLSearchParams({ timeRange, format });
    const response = await api.get(`/dashboard/export-data?${params.toString()}`);
    console.log('✅ Datos exportados exitosamente');
    return response.data;
  },

  // ===== MÉTODOS LEGACY =====

  async getStats(): Promise<DashboardStats> {
    console.log('📊 Solicitando estadísticas básicas');
    
    const response = await api.get<DashboardStats>('/dashboard/stats');
    console.log('✅ Estadísticas básicas recibidas');
    return response.data;
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    console.log('🕐 Solicitando actividad reciente (legacy)');
    
    const response = await api.get<RecentActivity[]>(`/dashboard/recent-activity?limit=${limit}`);
    console.log('✅ Actividad reciente (legacy) recibida:', response.data.length);
    return response.data;
  },

  async getUserGrowth(): Promise<UserGrowth[]> {
    console.log('📈 Solicitando crecimiento de usuarios');
    
    const response = await api.get<UserGrowth[]>('/dashboard/user-growth');
    console.log('✅ Crecimiento de usuarios recibido:', response.data.length);
    return response.data;
  },

  async getUsersByRole(): Promise<UsersByRole[]> {
    console.log('👔 Solicitando usuarios por rol');
    
    const response = await api.get<UsersByRole[]>('/dashboard/users-by-role');
    console.log('✅ Usuarios por rol recibidos:', response.data.length);
    return response.data;
  },

  // ===== MÉTODO PRINCIPAL PARA CARGAR TODO =====

  async getDashboardData(filters: DashboardFilters = {}) {
    console.log('🔄 Cargando TODOS los datos del dashboard...');
    
    const [stats, trends, regionalStats, centerStats, recentActivity] = await Promise.all([
      this.getEnhancedStats(filters),
      this.getAccessTrends(filters),
      this.getRegionalStats(filters.timeRange),
      this.getCenterStats(filters),
      this.getRecentActivityFiltered(10, filters)
    ]);

    const dashboardData = {
      stats,
      trends,
      regionalStats,
      centerStats,
      recentActivity,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Dashboard completo cargado con datos REALES!');
    return dashboardData;
  },

  // ===== MÉTODOS UTILITARIOS =====

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  },

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  getMetricColor(type: 'growth' | 'usage' | 'status', value: number): string {
    switch (type) {
      case 'growth':
        return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
      case 'usage':
        return value > 80 ? 'text-red-600' : value > 60 ? 'text-yellow-600' : 'text-green-600';
      case 'status':
        return value > 0 ? 'text-green-600' : 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  },

  getDefaultFilters(): DashboardFilters {
    return { timeRange: '7d' };
  },

  validateFilters(filters: DashboardFilters): DashboardFilters {
    const validTimeRanges = ['1d', '7d', '30d', '90d'];
    
    return {
      ...filters,
      timeRange: validTimeRanges.includes(filters.timeRange || '') ? filters.timeRange : '7d',
      regionalId: filters.regionalId && filters.regionalId > 0 ? filters.regionalId : undefined,
      centerId: filters.centerId && filters.centerId > 0 ? filters.centerId : undefined,
      personnelTypeId: filters.personnelTypeId && filters.personnelTypeId > 0 ? filters.personnelTypeId : undefined
    };
  },
  async getEnhancedActivity(filters: {
  days?: number;
  activityType?: 'entry' | 'exit' | 'all';
  fichaIds?: number[];
  userIds?: number[];
  limit?: number;
  offset?: number;
}): Promise<{ activities: any[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.days) params.append('days', filters.days.toString());
  if (filters.activityType) params.append('activityType', filters.activityType);
  if (filters.fichaIds?.length) params.append('fichaIds', filters.fichaIds.join(','));
  if (filters.userIds?.length) params.append('userIds', filters.userIds.join(','));
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const response = await api.get(`/dashboard/enhanced-activity?${params.toString()}`);
  return response.data;
},

async getFichas(): Promise<{id: number; code: string; name: string}[]> {
  const response = await api.get('/dashboard/fichas');
  return response.data;
}
};