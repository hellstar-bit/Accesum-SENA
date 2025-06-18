// frontend/src/pages/RecentActivity.tsx
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

interface ActivityFilters {
  days: number;
  activityType: 'entry' | 'exit' | 'all';
  fichaIds: number[];
  userIds: number[];
  limit: number;
  offset: number;
}

interface Activity {
  id: number;
  user: string;
  email: string;
  type: 'entry' | 'exit';
  time: string;
  center: string;
  userType: string;
  documentNumber: string;
  fichaCode?: string;
  fichaName?: string;
  profileImage?: string;
}

interface Ficha {
  id: number;
  code: string;
  name: string;
}

const UserAvatar = ({ profileImage, userName }: { profileImage?: string; userName: string }) => {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt={userName}
        className="h-10 w-10 rounded-full object-cover"
        onError={(e) => {
          // Si la imagen falla, mostrar initiales
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  
  return (
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
      <span className="text-sm font-medium text-gray-700">{initials}</span>
    </div>
  );
};

const RecentActivity = () => {
  // Estados principales
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  
  // Estados de filtros
  const [filters, setFilters] = useState<ActivityFilters>({
    days: 7,
    activityType: 'all',
    fichaIds: [],
    userIds: [],
    limit: 50,
    offset: 0
  });

  // Estados UI
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar actividades cuando cambien los filtros
  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const fichasData = await dashboardService.getFichas();
      setFichas(fichasData);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getEnhancedActivity(filters);
      setActivities(response.activities);
      setTotal(response.total);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setCurrentPage(page);
  };

  const toggleFichaFilter = (fichaId: number) => {
    const newFichaIds = filters.fichaIds.includes(fichaId)
      ? filters.fichaIds.filter(id => id !== fichaId)
      : [...filters.fichaIds, fichaId];
    updateFilters({ fichaIds: newFichaIds });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActivityIcon = (type: string) => {
    if (type === 'entry') {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      );
    }
  };

  const clearAllFilters = () => {
    setFilters({
      days: 7,
      activityType: 'all',
      fichaIds: [],
      userIds: [],
      limit: 50,
      offset: 0
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Actividad Reciente</h1>
            <p className="text-gray-600 mt-1">
              Registro completo de entradas y salidas del sistema
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filtros
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Filtro por Días */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de tiempo
              </label>
              <select
                value={filters.days}
                onChange={(e) => updateFilters({ days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Último día</option>
                <option value={7}>Últimos 7 días</option>
                <option value={15}>Últimos 15 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 3 meses</option>
              </select>
            </div>

            {/* Filtro por Tipo de Actividad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de actividad
              </label>
              <select
                value={filters.activityType}
                onChange={(e) => updateFilters({ activityType: e.target.value as 'entry' | 'exit' | 'all' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las actividades</option>
                <option value="entry">Solo entradas</option>
                <option value="exit">Solo salidas</option>
              </select>
            </div>

            {/* Filtro por Registros por página */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registros por página
              </label>
              <select
                value={filters.limit}
                onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25 registros</option>
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
              </select>
            </div>

            {/* Botón Limpiar Filtros */}
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Filtros por Ficha */}
          {fichas.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filtrar por Ficha ({filters.fichaIds.length} seleccionadas)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {fichas.map((ficha) => (
                  <button
                    key={ficha.id}
                    onClick={() => toggleFichaFilter(ficha.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.fichaIds.includes(ficha.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ficha.code} - {ficha.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen de Resultados */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{total}</span> registros encontrados
            </div>
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{activities.length}</span> registros
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">
                  {activities.filter(a => a.type === 'entry').length} Entradas
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">
                  {activities.filter(a => a.type === 'exit').length} Salidas
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={loadActivities}
            disabled={loading}
            className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de Actividades */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Cargando actividades...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividades</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron registros con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ficha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={`${activity.id}-${activity.type}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActivityIcon(activity.type)}
                          <div className="ml-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.type === 'entry' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {activity.type === 'entry' ? 'Entrada' : 'Salida'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 mr-4">
                            <UserAvatar profileImage={activity.profileImage} userName={activity.user} />
                            {/* Fallback oculto para cuando falle la imagen */}
                            <div className="hidden h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                {activity.user.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                            </div>
                            </div>
                            <div>
                            <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                            <div className="text-sm text-gray-500">{activity.userType}</div>
                            </div>
                        </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.documentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.fichaCode ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{activity.fichaCode}</div>
                            <div className="text-sm text-gray-500">{activity.fichaName}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin ficha</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.center}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(activity.time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;