// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';

interface DashboardStats {
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

interface RecentActivity {
  id: number;
  user: string;
  type: 'entry' | 'exit';
  time: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    todayAccess: 0,
    totalProfiles: 0,
    usersByType: {
      funcionarios: 0,
      contratistas: 0,
      aprendices: 0,
      visitantes: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos de ejemplo para actividad reciente
  const recentActivity: RecentActivity[] = [
    { id: 1, user: 'Juan Pérez', type: 'entry', time: '08:30 AM' },
    { id: 2, user: 'María López', type: 'entry', time: '08:45 AM' },
    { id: 3, user: 'Carlos Rodríguez', type: 'entry', time: '09:00 AM' },
    { id: 4, user: 'Ana Martínez', type: 'exit', time: '12:30 PM' },
    { id: 5, user: 'Luis García', type: 'entry', time: '02:15 PM' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulamos datos hasta implementar endpoints específicos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 156,
        activeUsers: 142,
        todayAccess: 89,
        totalProfiles: 156,
        usersByType: {
          funcionarios: 45,
          contratistas: 32,
          aprendices: 71,
          visitantes: 8,
        }
      });
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green"></div>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen del sistema de control de acceso</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Usuarios Activos</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Accesos Hoy</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.todayAccess}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Perfiles</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.totalProfiles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios por tipo */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Usuarios por Tipo</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(stats.usersByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    type === 'funcionarios' ? 'bg-blue-500' :
                    type === 'contratistas' ? 'bg-green-500' :
                    type === 'aprendices' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
          </div>
          <div className="divide-y">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.type === 'entry' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'entry' ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-500">
                      {activity.type === 'entry' ? 'Entrada' : 'Salida'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;