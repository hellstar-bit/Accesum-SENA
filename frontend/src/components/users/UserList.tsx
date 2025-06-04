// frontend/src/components/users/UserList.tsx - VERSIÓN MEJORADA COMPLETA
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { SweetAlertUtils } from '../../utils/sweetAlertUtils';
import type { User, UsersResponse, UserFilters, Ficha } from '../../services/userService';

interface UserListProps {
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
  onCreateUser: () => void;
  refreshTrigger: number;
  showViewAction?: boolean;
}

const UserList = ({ 
  onEditUser, 
  onViewUser, 
  onCreateUser, 
  refreshTrigger, 
  showViewAction = false 
}: UserListProps) => {
  // Estados principales
  const [users, setUsers] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  
  // Estados de filtros
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fichaFilter, setFichaFilter] = useState('');
  
  // Estados de UI
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    console.log('🔄 useEffect disparado por:', { currentPage, refreshTrigger });
    fetchUsers();
    loadFichas();
  }, [currentPage, refreshTrigger]);

  const loadFichas = async () => {
    try {
      const fichasData = await userService.getFichas();
      setFichas(fichasData);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🚀 Iniciando fetchUsers...');
      setLoading(true);
      setError(null);
      
      const response = await userService.getUsers(currentPage, 10);
      console.log('✅ Respuesta recibida:', response);
      setUsers(response);
      
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      console.log('🔍 Aplicando filtros:', { search, roleFilter, statusFilter, fichaFilter });
      
      SweetAlertUtils.general.showLoading('Buscando usuarios...', 'Aplicando filtros seleccionados');
      setCurrentPage(1);

      const filters: UserFilters = {};
      
      if (search.trim()) {
        filters.search = search.trim();
      }
      
      if (roleFilter) {
        filters.role = roleFilter;
      }
      
      if (statusFilter) {
        filters.status = statusFilter as 'active' | 'inactive';
      }

      if (fichaFilter) {
        filters.fichaId = parseInt(fichaFilter);
      }

      console.log('📡 Enviando filtros:', filters);
      
      const response = await userService.getUsers(1, 10, filters);
      
      console.log('✅ Respuesta con filtros:', response);
      setUsers(response);
      
      SweetAlertUtils.general.showSuccess(
        'Filtros aplicados',
        `Se encontraron ${response.total} usuarios`,
        2000
      );
      
    } catch (err: any) {
      console.error('❌ Error con filtros:', err);
      SweetAlertUtils.general.showError('Error al filtrar', err.message || 'Error al filtrar usuarios');
    }
  };

  const handleClearFilters = async () => {
    const hasFilters = search || roleFilter || statusFilter || fichaFilter;
    
    if (!hasFilters) {
      SweetAlertUtils.general.toast('No hay filtros activos', 'info');
      return;
    }

    const confirmed = await SweetAlertUtils.general.confirm({
      title: '🗑️ Limpiar Filtros',
      text: '¿Desea remover todos los filtros aplicados?',
      confirmText: 'Sí, limpiar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      setSearch('');
      setRoleFilter('');
      setStatusFilter('');
      setFichaFilter('');
      setCurrentPage(1);
      fetchUsers();
      SweetAlertUtils.general.toast('Filtros removidos', 'success');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const isActivating = !user.isActive;
    
    const confirmed = await SweetAlertUtils.user.confirmToggleStatus({
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      documentType: user.profile.documentType,
      documentNumber: user.profile.documentNumber,
      role: user.role.name
    }, isActivating);

    if (confirmed) {
      try {
        SweetAlertUtils.general.showLoading(
          `${isActivating ? 'Activando' : 'Desactivando'} usuario...`,
          'Por favor espere'
        );

        await userService.updateUser(user.id, {
          isActive: isActivating
        });

        await SweetAlertUtils.user.showStatusChanged({
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          documentType: user.profile.documentType,
          documentNumber: user.profile.documentNumber
        }, isActivating);

        // Recargar datos
        await fetchUsers();

      } catch (error: any) {
        SweetAlertUtils.general.showError(
          'Error al cambiar estado',
          error.message || 'No se pudo cambiar el estado del usuario'
        );
      }
    }
  };

  const handleRegenerateQR = async (user: User) => {
    const hasQR = !!user.profile.qrCode;
    
    const confirmed = await SweetAlertUtils.user.confirmRegenerateQR({
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      documentType: user.profile.documentType,
      documentNumber: user.profile.documentNumber
    }, hasQR);

    if (confirmed) {
      try {
        SweetAlertUtils.general.showLoading('Generando código QR...', 'Creando nuevo código');

        await SweetAlertUtils.user.showQRGenerated({
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          documentType: user.profile.documentType,
          documentNumber: user.profile.documentNumber
        });

        // Recargar datos
        await fetchUsers();

      } catch (error: any) {
        SweetAlertUtils.general.showError(
          'Error al generar QR',
          error.message || 'No se pudo generar el código QR'
        );
      }
    }
  };

  const handleEditUser = async (user: User) => {
    const confirmed = await SweetAlertUtils.user.confirmEdit({
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      documentType: user.profile.documentType,
      documentNumber: user.profile.documentNumber,
      role: user.role.name,
      profileImage: user.profile.profileImage
    });

    if (confirmed) {
      onEditUser(user);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Aprendiz': return 'bg-green-100 text-green-800 border-green-200';
      case 'Instructor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Administrador': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Funcionario': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Contratista': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Visitante': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Escaner': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Aprendiz': return '🎓';
      case 'Instructor': return '👨‍🏫';
      case 'Administrador': return '👑';
      case 'Funcionario': return '👔';
      case 'Contratista': return '🔧';
      case 'Visitante': return '👤';
      case 'Escaner': return '📱';
      default: return '👤';
    }
  };

  if (loading && !users) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sena-green border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium text-lg">Cargando usuarios...</p>
          <p className="text-gray-400 text-sm mt-2">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  if (error && !users) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error al cargar usuarios</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={fetchUsers} 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
          >
            🔄 Reintentar Carga
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || roleFilter || statusFilter || fichaFilter;

  return (
    <div className="space-y-6">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-r from-sena-green via-sena-green to-sena-dark rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 text-white">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Gestión de Usuarios
                </h2>
                <p className="text-sena-light opacity-90">
                  {users?.total || 0} usuarios registrados en el sistema
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Toggle View Mode */}
              <div className="bg-white bg-opacity-10 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white text-sena-green shadow-sm' 
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  📋 Tabla
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-white text-sena-green shadow-sm' 
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  🔲 Cards
                </button>
              </div>

              <button
                onClick={onCreateUser}
                className="bg-white text-sena-green px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="text-lg">+</span>
                <span>Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* Filtros Mejorados */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <span>🔍</span>
                <span>Filtros de Búsqueda</span>
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-white bg-opacity-10 px-4 py-2 rounded-lg text-sm hover:bg-opacity-20 transition-colors"
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 transition-all duration-300 ${showFilters || 'lg:block hidden'}`}>
              {/* Búsqueda Principal */}
              <div className="lg:col-span-4 relative">
                <div className={`relative transition-all duration-200 ${searchFocused ? 'transform scale-105' : ''}`}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="🔍 Buscar por nombre, documento o email..."
                    className="w-full px-4 py-3 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 shadow-lg"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filtro por Rol */}
              <div className="lg:col-span-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 shadow-lg"
                >
                  <option value="">Todos los roles</option>
                  <option value="Administrador">👑 Administrador</option>
                  <option value="Instructor">👨‍🏫 Instructor</option>
                  <option value="Aprendiz">🎓 Aprendiz</option>
                  <option value="Funcionario">👔 Funcionario</option>
                  <option value="Contratista">🔧 Contratista</option>
                  <option value="Visitante">👤 Visitante</option>
                  <option value="Escaner">📱 Escáner</option>
                </select>
              </div>

              {/* Filtro por Estado */}
              <div className="lg:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 shadow-lg"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">✅ Activos</option>
                  <option value="inactive">🚫 Inactivos</option>
                </select>
              </div>

              {/* Filtro por Ficha */}
              <div className="lg:col-span-2">
                <select
                  value={fichaFilter}
                  onChange={(e) => setFichaFilter(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 shadow-lg"
                >
                  <option value="">Todas las fichas</option>
                  {fichas.map((ficha) => (
                    <option key={ficha.id} value={ficha.id}>
                      📋 {ficha.code} - {ficha.name.length > 30 ? `${ficha.name.substring(0, 30)}...` : ficha.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de Acción */}
              <div className="lg:col-span-2 flex space-x-2">
                <button
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="flex-1 bg-white text-sena-green px-4 py-3 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🔍 Buscar
                </button>
                <button
                  onClick={handleClearFilters}
                  disabled={loading}
                  className="flex-1 bg-sena-light bg-opacity-20 text-white px-4 py-3 rounded-xl hover:bg-opacity-30 font-semibold transition-all disabled:opacity-50"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>

            {/* Info de Resultados Mejorada */}
            {users && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-sena-light border-opacity-30">
                <div className="flex items-center space-x-4">
                  <span className="text-sena-light text-sm flex items-center space-x-2">
                    <span>📊</span>
                    <span>
                      Mostrando {users.data.length} de {users.total} usuarios
                      {users.totalPages > 1 && ` (página ${users.page} de ${users.totalPages})`}
                    </span>
                  </span>
                  {loading && (
                    <div className="flex items-center space-x-2 text-sena-light text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>
                
                {hasActiveFilters && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sena-light text-sm">Filtros activos:</span>
                    <div className="flex space-x-1">
                      {search && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">Búsqueda</span>}
                      {roleFilter && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">Rol</span>}
                      {statusFilter && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">Estado</span>}
                      {fichaFilter && <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">Ficha</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {viewMode === 'table' ? (
        // Vista de Tabla Mejorada
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>Usuario</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>🎭</span>
                      <span>Rol</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Estado</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>📋</span>
                      <span>Ficha</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-2">
                      <span>⚙️</span>
                      <span>Acciones</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.data.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {user.profile.profileImage ? (
                            <img 
                              src={user.profile.profileImage} 
                              alt={`${user.profile.firstName} ${user.profile.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sena-green to-sena-dark flex items-center justify-center text-white font-bold text-sm">
                              {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.profile.firstName} {user.profile.lastName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-1">
                            <span>{user.profile.documentType}:</span>
                            <span className="font-mono">{user.profile.documentNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role.name)}`}>
                        <span className="mr-1">{getRoleIcon(user.role.name)}</span>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.isActive ? '✅ Activo' : '🚫 Inactivo'}
                        </span>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            user.isActive 
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.isActive ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.profile.ficha ? (
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900">{user.profile.ficha.code}</div>
                          <div className="text-gray-500 truncate max-w-32" title={user.profile.ficha.name}>
                            {user.profile.ficha.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin ficha</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {showViewAction && (
                          <button
                            onClick={() => onViewUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                            title="Ver detalles"
                          >
                            👁️ Ver
                          </button>
                        )}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                          title="Editar usuario"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleRegenerateQR(user)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-purple-50"
                          title="Regenerar código QR"
                        >
                          📱 QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vista de Cards Mejorada
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users?.data.map((user) => (
            <div 
              key={user.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-sena-green group"
            >
              {/* Header de la Card */}
              <div className="bg-gradient-to-r from-sena-green to-sena-dark p-4 text-white">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {user.profile.profileImage ? (
                      <img 
                        src={user.profile.profileImage} 
                        alt={`${user.profile.firstName} ${user.profile.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
                        {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate">
                      {user.profile.firstName} {user.profile.lastName}
                    </h3>
                    <p className="text-sena-light text-xs opacity-90">
                      {user.profile.documentType}: {user.profile.documentNumber}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  </div>
                </div>
              </div>

              {/* Contenido de la Card */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm text-gray-900 truncate" title={user.email}>{user.email}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rol</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                        <span className="mr-1">{getRoleIcon(user.role.name)}</span>
                        {user.role.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '✅' : '🚫'}
                      </span>
                    </div>
                  </div>
                </div>

                {user.profile.ficha && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ficha</label>
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-gray-900">{user.profile.ficha.code}</p>
                      <p className="text-xs text-gray-600 truncate" title={user.profile.ficha.name}>
                        {user.profile.ficha.name}
                      </p>
                    </div>
                  </div>
                )}

                {user.profile.qrCode && (
                  <div className="flex items-center justify-center">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                      📱 QR Generado
                    </span>
                  </div>
                )}
              </div>

              {/* Footer con Acciones */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    {showViewAction && (
                      <button
                        onClick={() => onViewUser(user)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                    )}
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleRegenerateQR(user)}
                      className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Regenerar QR"
                    >
                      📱
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleUserStatus(user)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      user.isActive 
                        ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                        : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                    }`}
                  >
                    {user.isActive ? '🚫 Desactivar' : '✅ Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado Vacío Mejorado */}
      {users?.data.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center shadow-lg border border-gray-200">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sena-green to-sena-dark flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl text-white">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {hasActiveFilters ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'Intenta ajustar los filtros de búsqueda o crear un nuevo usuario si es necesario.'
              : 'El sistema está listo para recibir usuarios. Comienza creando tu primer usuario.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters} 
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🗑️ Limpiar Filtros
              </button>
            )}
            <button 
              onClick={onCreateUser} 
              className="bg-gradient-to-r from-sena-green to-sena-dark text-white px-8 py-3 rounded-xl hover:from-sena-dark hover:to-sena-green transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ➕ Crear Primer Usuario
            </button>
          </div>
        </div>
      )}

      {/* Paginación Mejorada */}
      {users && users.totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">
                Página {users.page} de {users.totalPages}
              </span>
              <span className="text-xs text-gray-500">
                ({users.total} usuarios en total)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                title="Primera página"
              >
                ⏮️
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
              
              {/* Números de página */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, users.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(users.totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        pageNum === currentPage
                          ? 'bg-gradient-to-r from-sena-green to-sena-dark text-white shadow-lg'
                          : 'border hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, users.totalPages))}
                disabled={currentPage === users.totalPages || loading}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Siguiente →
              </button>
              <button
                onClick={() => setCurrentPage(users.totalPages)}
                disabled={currentPage === users.totalPages || loading}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                title="Última página"
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;