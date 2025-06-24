import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ⭐ IMPORTAR Link de React Router
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Importar el servicio real
import { dashboardService } from '../services/dashboardService';
import type { 
  EnhancedDashboardStats, 
  AccessTrendData, 
  RegionalStatsData, 
  CenterStatsData, 
  DashboardFilters 
} from '../services/dashboardService';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const Dashboard = () => {
  // Estados principales
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [accessTrends, setAccessTrends] = useState<AccessTrendData[]>([]);
  const [regionalStats, setRegionalStats] = useState<RegionalStatsData[]>([]);
  const [centerStats, setCenterStats] = useState<CenterStatsData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [selectedRegional, setSelectedRegional] = useState<number | undefined>(undefined);
  const [selectedCenter,] = useState<number | undefined>(undefined);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Cargar datos al montar y cuando cambien los filtros
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange, selectedRegional, selectedCenter]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [selectedTimeRange, selectedRegional, selectedCenter]);

  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const filters: DashboardFilters = {
        timeRange: selectedTimeRange,
        regionalId: selectedRegional,
        centerId: selectedCenter
      };

      console.log('📊 Cargando dashboard con filtros:', filters);

      // Cargar todos los datos en paralelo
      const [
        statsData, 
        trendsData, 
        regionalData, 
        centerData, 
        activityData
      ] = await Promise.all([
        dashboardService.getEnhancedStats(filters),
        dashboardService.getAccessTrends(filters),
        dashboardService.getRegionalStats(filters.timeRange),
        dashboardService.getCenterStats(filters),
        dashboardService.getRecentActivityFiltered(10, filters)
      ]);
      
      setStats(statsData);
      setAccessTrends(trendsData);
      setRegionalStats(regionalData);
      setCenterStats(centerData);
      setRecentActivity(activityData);
      setLastUpdate(new Date());
      
      console.log('✅ Dashboard cargado exitosamente:', {
        stats: statsData.totalUsers,
        trends: trendsData.length,
        regionals: regionalData.length,
        centers: centerData.length,
        activity: activityData.length
      });
      
    } catch (err: any) {
      console.error('❌ Error cargando dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return (
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 10H7" />
        </svg>
      );
    } else if (growth < 0) {
      return (
        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0-10h10" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  // Preparar datos para gráficos
  const pieData = stats ? Object.entries(stats.usersByType).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  })).filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="ml-3 text-red-700">{error}</p>
        </div>
        <button onClick={() => fetchDashboardData()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header con Filtros */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Control</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo en tiempo real del sistema de acceso SENA
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Última actualización: {lastUpdate.toLocaleString('es-CO')}
          </p>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '1d' | '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="1d">Último día</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 3 meses</option>
          </select>
          
          <select 
            value={selectedRegional || ''}
            onChange={(e) => setSelectedRegional(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las regionales</option>
            {regionalStats.map(regional => (
              <option key={regional.regionalId} value={regional.regionalId}>
                {regional.regional}
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Usuarios</p>
              <p className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</p>
              <div className="flex items-center mt-1">
                {getGrowthIcon(stats.growthMetrics.userGrowthWeekly)}
                <p className="text-blue-100 text-xs ml-1">
                  {Math.abs(stats.growthMetrics.userGrowthWeekly).toFixed(1)}% vs semana anterior
                </p>
              </div>
            </div>
            <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Usuarios Activos</p>
              <p className="text-3xl font-bold">{formatNumber(stats.activeUsers)}</p>
              <p className="text-green-100 text-xs mt-1">
                {((stats.activeUsers/stats.totalUsers)*100).toFixed(1)}% del total
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">
                Accesos {selectedTimeRange === '1d' ? 'Hoy' : `Últimos ${selectedTimeRange.slice(0, -1)} días`}
              </p>
              <p className="text-3xl font-bold">{formatNumber(stats.todayAccess)}</p>
              <div className="flex items-center mt-1">
                {getGrowthIcon(stats.growthMetrics.accessGrowthDaily)}
                <p className="text-yellow-100 text-xs ml-1">
                  {Math.abs(stats.growthMetrics.accessGrowthDaily).toFixed(1)}% vs ayer
                </p>
              </div>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 p-3 rounded-full">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Promedio Diario</p>
              <p className="text-3xl font-bold">{formatNumber(stats.averageAccessPerDay)}</p>
              <p className="text-purple-100 text-xs mt-1">
                Hora pico: {stats.peakHour}:00
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Accesos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Tendencia de Accesos</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Accesos diarios
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accessTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => `Fecha: ${formatDate(value as string)}`}
                formatter={(value) => [value, 'Accesos']}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Usuarios por Tipo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribución por Tipo de Usuario</h2>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Usuarios']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Estadísticas por Regional y Centro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas por Regional */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Usuarios por Regional</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="regional" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" name="Total Usuarios" />
              <Bar dataKey="active" fill="#10B981" name="Usuarios Activos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Centros */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Centros - Accesos Hoy</h2>
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {centerStats.slice(0, 5).map((center, index) => (
              <div key={center.centerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 text-xs font-bold rounded-full mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{center.center}</h3>
                      <p className="text-gray-500 text-xs">{formatNumber(center.users)} usuarios registrados</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{center.todayAccess}</p>
                  <p className="text-xs text-gray-500">accesos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Actividad Reciente</h2>
          {/* ⭐ ENLACE CORREGIDO - AHORA VA A /recent-activity */}
          <Link 
            to="/recent-activity" 
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1 transition-colors"
          >
            <span>Ver todo</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {activity.profileImage ? (
                          <img
                            src={activity.profileImage}
                            alt={activity.user}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {activity.user.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                        <div className="text-sm text-gray-500">{activity.userType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.type === 'entry' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.type === 'entry' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(activity.time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.center}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Exitoso
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;