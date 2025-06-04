// frontend/src/components/users/UserList.tsx - VERSIÓN PARA DEBUGGING
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import type { User, UsersResponse, UserFilters } from '../../services/userService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 🔧 Filtros básicos - SIN DEBOUNCE por ahora
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    console.log('🔄 useEffect disparado por:', { currentPage, refreshTrigger });
    fetchUsers();
  }, [currentPage, refreshTrigger]);

  const fetchUsers = async () => {
    try {
      console.log('🚀 Iniciando fetchUsers...');
      setLoading(true);
      setError(null);
      
      // 🔧 SIN FILTROS por ahora - solo carga básica
      console.log('📡 Llamando userService.getUsers con parámetros básicos...');
      
      const response = await userService.getUsers(currentPage, 10);
      
      console.log('✅ Respuesta recibida:', response);
      setUsers(response);
      
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error response:', err.response);
      
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Función simple para aplicar filtros manualmente
  const handleApplyFilters = async () => {
    try {
      console.log('🔍 Aplicando filtros:', { search, roleFilter, statusFilter });
      
      setLoading(true);
      setError(null);
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

      console.log('📡 Enviando filtros:', filters);
      
      const response = await userService.getUsers(1, 10, filters);
      
      console.log('✅ Respuesta con filtros:', response);
      setUsers(response);
      
    } catch (err: any) {
      console.error('❌ Error con filtros:', err);
      setError(err.message || 'Error al filtrar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchUsers(); // Recargar sin filtros
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error && !users) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-red-800">Error al cargar usuarios</h3>
            <p className="text-red-700">{error}</p>
          </div>
          <button onClick={fetchUsers} className="ml-4 btn-primary">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header simplificado */}
      <div className="bg-gradient-to-r from-sena-green to-sena-dark px-6 py-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">
              👥 Gestión de Usuarios ({users?.total || 0})
            </h2>
          </div>
          <button
            onClick={onCreateUser}
            className="bg-white text-sena-green px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
          >
            <span>+ Nuevo Usuario</span>
          </button>
        </div>

        {/* 🔧 Filtros básicos con botón */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar..."
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none"
            />
          </div>
          
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 focus:outline-none"
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

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex-1 bg-white text-sena-green px-3 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              🔍 Buscar
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="flex-1 bg-sena-light bg-opacity-20 text-white px-3 py-2 rounded-lg hover:bg-opacity-30 font-medium transition-colors disabled:opacity-50"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>

        {/* Info de resultados */}
        {users && (
          <div className="mt-3 pt-3 border-t border-sena-light border-opacity-30">
            <span className="text-sena-light text-sm">
              📊 Mostrando {users.data.length} de {users.total} usuarios
              {users.totalPages > 1 && ` (página ${users.page} de ${users.totalPages})`}
            </span>
          </div>
        )}
      </div>

      {/* Tabla básica */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.profile.firstName} {user.profile.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.profile.documentType}: {user.profile.documentNumber}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role.name === 'Aprendiz' ? 'bg-green-100 text-green-800' :
                    user.role.name === 'Instructor' ? 'bg-blue-100 text-blue-800' :
                    user.role.name === 'Administrador' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? '✅ Activo' : '🚫 Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {showViewAction && (
                      <button
                        onClick={() => onViewUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        👁️ Ver
                      </button>
                    )}
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users?.data.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500 mb-6">
            No hay usuarios que coincidan con los criterios de búsqueda.
          </p>
          <div className="space-x-3">
            <button onClick={handleClearFilters} className="btn-secondary">
              🗑️ Limpiar Filtros
            </button>
            <button onClick={onCreateUser} className="btn-primary">
              ➕ Crear Usuario
            </button>
          </div>
        </div>
      )}

      {/* Paginación básica */}
      {users && users.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {users.page} de {users.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, users.totalPages))}
              disabled={currentPage === users.totalPages || loading}
              className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;