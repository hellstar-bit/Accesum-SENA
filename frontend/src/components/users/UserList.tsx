// frontend/src/components/users/UserList.tsx - OPTIMIZADO
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { profileService } from '../../services/profileService';
import Swal from 'sweetalert2';
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
  const [processingAction, setProcessingAction] = useState<number | null>(null);
  
  // Filtros mejorados
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: undefined,
    fichaId: undefined,
  });

  useEffect(() => {
    fetchUsers();
    fetchFichas();
  }, [currentPage, refreshTrigger]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      ) as UserFilters;

      const response = await userService.getUsers(currentPage, 10, cleanFilters);
      setUsers(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      
      // SweetAlert para errores de carga
      Swal.fire({
        icon: 'error',
        title: '❌ Error de Carga',
        text: err.response?.data?.message || 'No se pudieron cargar los usuarios',
        confirmButtonColor: '#dc2626',
        timer: 5000,
        timerProgressBar: true
      });
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

  // ⭐ NUEVA FUNCIÓN - Activar/Desactivar Usuario con SweetAlert
  const handleToggleUserStatus = async (user: User) => {
    const isActivating = !user.isActive;
    
    const result = await Swal.fire({
      title: `${isActivating ? '✅ Activar' : '🚫 Desactivar'} Usuario`,
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-16 h-16 rounded-full mx-auto ${isActivating ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center text-2xl mb-3">
              ${isActivating ? '🔓' : '🔒'}
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            ${user.profile.firstName} ${user.profile.lastName}
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            ${user.profile.documentType}: ${user.profile.documentNumber}
          </p>
          <div class="bg-${isActivating ? 'green' : 'red'}-50 border border-${isActivating ? 'green' : 'red'}-200 rounded-lg p-3">
            <p class="text-sm text-${isActivating ? 'green' : 'red'}-700">
              ${isActivating 
                ? '¿Desea activar este usuario? Podrá acceder al sistema nuevamente.' 
                : '¿Desea desactivar este usuario? No podrá acceder al sistema hasta ser reactivado.'}
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isActivating ? '#16a34a' : '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `${isActivating ? 'Sí, activar' : 'Sí, desactivar'}`,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });

    if (result.isConfirmed) {
      try {
        setProcessingAction(user.id);
        
        // Mostrar loading
        Swal.fire({
          title: `${isActivating ? 'Activando' : 'Desactivando'}...`,
          text: 'Procesando cambios en el usuario',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await userService.updateUser(user.id, { isActive: isActivating });
        await fetchUsers();

        // Mostrar éxito
        await Swal.fire({
          title: `${isActivating ? '✅ Usuario Activado' : '🚫 Usuario Desactivado'}`,
          html: `
            <div class="text-center">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                ${user.profile.firstName} ${user.profile.lastName}
              </h3>
              <p class="text-sm text-gray-600">
                ${isActivating 
                  ? 'El usuario puede acceder al sistema nuevamente' 
                  : 'El usuario ya no puede acceder al sistema'}
              </p>
            </div>
          `,
          icon: 'success',
          iconColor: isActivating ? '#16a34a' : '#dc2626',
          confirmButtonColor: isActivating ? '#16a34a' : '#dc2626',
          timer: 3000,
          timerProgressBar: true
        });

      } catch (err: any) {
        await Swal.fire({
          title: '❌ Error',
          text: err.response?.data?.message || `Error al ${isActivating ? 'activar' : 'desactivar'} usuario`,
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        setProcessingAction(null);
      }
    }
  };

  // ⭐ NUEVA FUNCIÓN - Regenerar QR con SweetAlert
  const handleRegenerateQR = async (user: User) => {
    const result = await Swal.fire({
      title: '🔄 Regenerar Código QR',
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-16 h-16 rounded-full mx-auto bg-purple-100 flex items-center justify-center text-2xl mb-3">
              📱
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            ${user.profile.firstName} ${user.profile.lastName}
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            ${user.profile.documentType}: ${user.profile.documentNumber}
          </p>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p class="text-sm text-purple-700">
              Se generará un nuevo código QR para este usuario. 
              ${user.profile.qrCode 
                ? 'El código anterior quedará invalidado.' 
                : 'Es la primera vez que se genera el QR.'}
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, regenerar QR',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        setProcessingAction(user.id);
        
        Swal.fire({
          title: 'Generando QR...',
          text: 'Creando nuevo código QR único',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await profileService.regenerateQR(user.profile.id);
        await fetchUsers();

        await Swal.fire({
          title: '✅ Código QR Generado',
          html: `
            <div class="text-center">
              <div class="mb-4">
                <div class="w-16 h-16 rounded-full mx-auto bg-green-100 flex items-center justify-center text-2xl mb-3">
                  ✅
                </div>
              </div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                ${user.profile.firstName} ${user.profile.lastName}
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                El nuevo código QR ha sido generado exitosamente
              </p>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                <p class="text-sm text-green-700">
                  El usuario ya puede usar su nuevo QR para el control de acceso
                </p>
              </div>
            </div>
          `,
          icon: 'success',
          iconColor: '#16a34a',
          confirmButtonColor: '#16a34a',
          timer: 4000,
          timerProgressBar: true
        });

      } catch (err: any) {
        await Swal.fire({
          title: '❌ Error al Generar QR',
          text: err.response?.data?.message || 'No se pudo generar el código QR',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        setProcessingAction(null);
      }
    }
  };

  // ⭐ NUEVA FUNCIÓN - Confirmación mejorada para editar
  const handleEditUser = async (user: User) => {
    const result = await Swal.fire({
      title: '✏️ Editar Usuario',
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-16 h-16 rounded-full mx-auto bg-blue-100 flex items-center justify-center text-2xl mb-3">
              📝
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            ${user.profile.firstName} ${user.profile.lastName}
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            ${user.role.name} - ${user.profile.documentNumber}
          </p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-700">
              Se abrirá el formulario para editar la información de este usuario
            </p>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Abrir Editor',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      onEditUser(user);
    }
  };

  const selectedFicha = fichas.find(f => f.id === filters.fichaId);

  if (loading && !users) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando usuarios...</p>
          <p className="text-gray-400 text-sm">Esto puede tomar unos segundos</p>
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
      {/* Header con filtros mejorado */}
      <div className="bg-gradient-to-r from-sena-green to-sena-dark px-6 py-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">
              👥 Gestión de Usuarios ({users?.total || 0})
            </h2>
            {selectedFicha && (
              <p className="text-sena-light text-sm mt-1">
                📋 Ficha: {selectedFicha.code} - {selectedFicha.name} ({selectedFicha.status})
              </p>
            )}
          </div>
          <button
            onClick={onCreateUser}
            className="bg-white text-sena-green px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Filtros en header */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="🔍 Buscar por nombre, documento o email..."
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
          </div>
          
          <div>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
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
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div>
            <select
              value={filters.fichaId || ''}
              onChange={(e) => handleFilterChange('fichaId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
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

          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-white text-sena-green px-3 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              🔍 Filtrar
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 bg-sena-light bg-opacity-20 text-white px-3 py-2 rounded-lg hover:bg-opacity-30 font-medium transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>

        {/* Filtros activos */}
        {(filters.search || filters.role || filters.status || filters.fichaId) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sena-light border-opacity-30">
            <span className="text-sm font-medium">Filtros activos:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                Búsqueda: "{filters.search}"
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                Rol: {filters.role}
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                Estado: {filters.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            )}
            {selectedFicha && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                Ficha: {selectedFicha.code}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table mejorada */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Aquí van los encabezados de la tabla */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {filters.role === 'Aprendiz' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ficha</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regional / Centro</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.data.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.profile.firstName} {user.profile.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.profile.documentType}: {user.profile.documentNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                {/* ⭐ COLUMNA ROL SIMPLIFICADA - Solo mostrar el rol del usuario */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role.name === 'Aprendiz' ? 'bg-green-100 text-green-800' :
                    user.role.name === 'Instructor' ? 'bg-blue-100 text-blue-800' :
                    user.role.name === 'Administrador' ? 'bg-purple-100 text-purple-800' :
                    user.role.name === 'Funcionario' ? 'bg-indigo-100 text-indigo-800' :
                    user.role.name === 'Contratista' ? 'bg-orange-100 text-orange-800' :
                    user.role.name === 'Visitante' ? 'bg-gray-100 text-gray-800' :
                    user.role.name === 'Escaner' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role.name}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '✅ Activo' : '🚫 Inactivo'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        user.profile.qrCode 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.profile.qrCode ? '📱 QR' : '⚠️ Sin QR'}
                      </span>
                    </div>
                  </div>
                </td>

                {filters.role === 'Aprendiz' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile.ficha ? (
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">{user.profile.ficha.code}</div>
                        <div className="text-gray-500 truncate max-w-24" title={user.profile.ficha.name}>
                          {user.profile.ficha.name}
                        </div>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
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
                    <div className="font-medium text-gray-900">{user.profile.regional.name}</div>
                    <div className="text-gray-500">{user.profile.center.name}</div>
                  </div>
                </td>

                {/* ⭐ NUEVAS ACCIONES MEJORADAS */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-1">
                    {/* Ver Usuario */}
                    {showViewAction && (
                      <button
                        onClick={() => onViewUser(user)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded hover:bg-indigo-200 transition-colors"
                        title="Ver perfil completo"
                      >
                        👁️ Ver
                      </button>
                    )}

                    {/* Editar Usuario */}
                    <button
                      onClick={() => handleEditUser(user)}
                      disabled={processingAction === user.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Editar usuario y perfil"
                    >
                      {processingAction === user.id ? '⏳' : user.isActive ? '🚫' : '✅'} 
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State mejorado */}
      {users?.data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).some(v => v !== undefined && v !== '') 
              ? 'Intenta ajustar los filtros de búsqueda para encontrar usuarios'
              : 'Comienza creando el primer usuario del sistema'}
          </p>
          
          {Object.values(filters).some(v => v !== undefined && v !== '') ? (
            <div className="space-x-3">
              <button onClick={handleClearFilters} className="btn-secondary">
                🗑️ Limpiar Filtros
              </button>
              <button onClick={onCreateUser} className="btn-primary">
                ➕ Crear Usuario
              </button>
            </div>
          ) : (
            <button onClick={onCreateUser} className="btn-primary">
              <svg className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Usuario
            </button>
          )}
        </div>
      )}

      {/* Pagination mejorada */}
      {users && users.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">📊</span>
            Mostrando {((users.page - 1) * users.limit) + 1} a {Math.min(users.page * users.limit, users.total)} de {users.total} usuarios
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              ← Anterior
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, users.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-sena-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {users.totalPages > 5 && (
                <>
                  <span className="px-2 py-2 text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(users.totalPages)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      users.totalPages === currentPage
                        ? 'bg-sena-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {users.totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, users.totalPages))}
              disabled={currentPage === users.totalPages}
              className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay para acciones */}
      {processingAction && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sena-green"></div>
              <span className="text-gray-700 font-medium">Procesando acción...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;