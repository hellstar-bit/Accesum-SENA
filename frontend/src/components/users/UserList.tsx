// frontend/src/components/users/UserList.tsx - Con filtro por ficha
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { profileService } from '../../services/profileService';
import type { User, UsersResponse, Ficha, UserFilters } from '../../services/userService';

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
  const [users, setUsers] = useState<UsersResponse | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // ⭐ FILTROS MEJORADOS
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: undefined,
    fichaId: undefined,
  });

  useEffect(() => {
    fetchUsers();
    fetchFichas(); // ⭐ Cargar fichas para el filtro
  }, [currentPage, refreshTrigger]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpiar filtros vacíos
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      ) as UserFilters;

      const response = await userService.getUsers(currentPage, 10, cleanFilters);
      setUsers(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchFichas = async () => {
    try {
      const fichasData = await userService.getFichas();
      setFichas(fichasData);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: undefined,
      fichaId: undefined,
    });
    setCurrentPage(1);
    setTimeout(fetchUsers, 100);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`¿Desactivar usuario ${user.profile.firstName} ${user.profile.lastName}?`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al desactivar usuario');
    }
  };

  const handleRegenerateQR = async (user: User) => {
    if (!confirm(`¿Regenerar código QR para ${user.profile.firstName} ${user.profile.lastName}?`)) {
      return;
    }

    try {
      await profileService.regenerateQR(user.profile.id);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al regenerar código QR');
    }
  };

  // ⭐ OBTENER FICHA SELECCIONADA
  const selectedFicha = fichas.find(f => f.id === filters.fichaId);

  if (loading && !users) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  if (error && !users) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchUsers} className="mt-2 btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header con filtros */}
      <div className="px-6 py-4 border-b space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Lista de Usuarios ({users?.total || 0})
            </h2>
            {/* ⭐ MOSTRAR INFORMACIÓN DE FICHA SELECCIONADA */}
            {selectedFicha && (
              <p className="text-sm text-blue-600 mt-1">
                📋 Ficha: {selectedFicha.code} - {selectedFicha.name} ({selectedFicha.status})
              </p>
            )}
          </div>
          <button
            onClick={onCreateUser}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* ⭐ FILTROS MEJORADOS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Buscar por nombre, documento o email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green text-sm"
            />
          </div>
          
          {/* Rol */}
          <div>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green text-sm"
            >
              <option value="">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Instructor">Instructor</option>
              <option value="Aprendiz">Aprendiz</option>
              <option value="Funcionario">Funcionario</option>
              <option value="Contratista">Contratista</option>
              <option value="Visitante">Visitante</option>
              <option value="Escaner">Escáner</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* ⭐ FILTRO POR FICHA - Solo visible si el rol es Aprendiz */}
          <div>
            <select
              value={filters.fichaId || ''}
              onChange={(e) => handleFilterChange('fichaId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green text-sm"
              disabled={filters.role !== 'Aprendiz'}
            >
              <option value="">
                {filters.role === 'Aprendiz' ? 'Todas las fichas' : 'Seleccione rol Aprendiz'}
              </option>
              {filters.role === 'Aprendiz' && fichas.map((ficha) => (
                <option key={ficha.id} value={ficha.id}>
                  {ficha.code} - {ficha.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-sena-green text-white px-3 py-2 rounded-lg hover:bg-sena-dark text-sm font-medium transition-colors"
            >
              Filtrar
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* ⭐ INFORMACIÓN DE FILTROS ACTIVOS */}
        {(filters.search || filters.role || filters.status || filters.fichaId) && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Búsqueda: "{filters.search}"
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Rol: {filters.role}
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Estado: {filters.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            )}
            {selectedFicha && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Ficha: {selectedFicha.code}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol / Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado / QR
              </th>
              {/* ⭐ MOSTRAR COLUMNA FICHA SOLO PARA APRENDICES */}
              {filters.role === 'Aprendiz' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ficha
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-sena-light flex items-center justify-center text-sena-green font-bold">
                      {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.profile.firstName} {user.profile.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.profile.documentType} {user.profile.documentNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role.name === 'Aprendiz' ? 'bg-green-100 text-green-800' :
                      user.role.name === 'Instructor' ? 'bg-blue-100 text-blue-800' :
                      user.role.name === 'Administrador' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {user.profile.type.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="text-xs">
                      <span className={`inline-flex px-1 py-0.5 rounded text-xs ${
                        user.profile.qrCode 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        QR: {user.profile.qrCode ? '✓' : '⚠'}
                      </span>
                    </div>
                  </div>
                </td>
                {/* ⭐ MOSTRAR INFORMACIÓN DE FICHA PARA APRENDICES */}
                {filters.role === 'Aprendiz' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile.ficha ? (
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">{user.profile.ficha.code}</div>
                        <div className="text-gray-500 truncate max-w-24" title={user.profile.ficha.name}>
                          {user.profile.ficha.name}
                        </div>
                        <span className={`inline-flex px-1 py-0.5 rounded text-xs ${
                          user.profile.ficha.status === 'EN EJECUCIÓN' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.profile.ficha.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin ficha</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  <div>
                    <div className="font-medium">{user.profile.regional.name}</div>
                    <div>{user.profile.center.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-1">
                    <div className="flex space-x-2">
                      {showViewAction && (
                        <button
                          onClick={() => onViewUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs"
                          title="Ver perfil completo"
                        >
                          👁️ Ver
                        </button>
                      )}
                      <button
                        onClick={() => onEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        title="Editar usuario"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRegenerateQR(user)}
                        className="text-purple-600 hover:text-purple-900 text-xs"
                        title="Regenerar código QR"
                      >
                        🔄 QR
                      </button>
                      {user.isActive && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 text-xs"
                          title="Desactivar usuario"
                        >
                          🚫 Desactivar
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users?.data.length === 0 && !loading && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron usuarios</h3>
          <p className="mt-1 text-sm text-gray-500">
            {Object.values(filters).some(v => v !== undefined && v !== '') 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando un nuevo usuario'}
          </p>
          {!Object.values(filters).some(v => v !== undefined && v !== '') && (
            <div className="mt-6">
              <button onClick={onCreateUser} className="btn-primary">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Usuario
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {users && users.totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((users.page - 1) * users.limit) + 1} a {Math.min(users.page * users.limit, users.total)} de {users.total} usuarios
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              Página {currentPage} de {users.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, users.totalPages))}
              disabled={currentPage === users.totalPages}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;