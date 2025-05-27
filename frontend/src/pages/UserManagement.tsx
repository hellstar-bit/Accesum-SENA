// frontend/src/pages/UserManagement.tsx - Versión Unificada
import { useState, useEffect } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import UserView from '../components/users/UserView.tsx';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import type { User, UserStats } from '../services/userService';
import type { ProfileStats } from '../services/profileService';

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [activeView, setActiveView] = useState<'form' | 'detail'>('form');

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const [userStatsData, profileStatsData] = await Promise.all([
        userService.getUserStats(),
        profileService.getProfileStats()
      ]);
      setUserStats(userStatsData);
      setProfileStats(profileStatsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setViewingUser(null);
    setShowCreateForm(false);
    setActiveView('form');
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setSelectedUser(null);
    setShowCreateForm(false);
    setActiveView('detail');
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewingUser(null);
    setShowCreateForm(true);
    setActiveView('form');
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setViewingUser(null);
    setShowCreateForm(false);
  };

  const handleUserSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseModal();
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    // Mantener la vista abierta para ver los cambios
  };

  // Combinar estadísticas de usuarios y perfiles
  const getCombinedStats = () => {
    if (!userStats || !profileStats) return null;

    return [
      {
        title: 'Total Usuarios',
        value: userStats.totalUsers,
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        color: 'blue',
        description: 'Usuarios registrados en el sistema'
      },
      {
        title: 'Usuarios Activos',
        value: userStats.activeUsers,
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'green',
        description: 'Usuarios con acceso habilitado'
      },
      {
        title: 'Usuarios Inactivos',
        value: userStats.inactiveUsers,
        icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728',
        color: 'red',
        description: 'Usuarios deshabilitados'
      },
      {
        title: 'Con Código QR',
        value: profileStats.profilesWithQR,
        icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
        color: 'purple',
        description: 'Perfiles con QR generado'
      },
      {
        title: 'Sin Código QR',
        value: profileStats.profilesWithoutQR,
        icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'yellow',
        description: 'Perfiles pendientes de QR'
      },
      {
        title: 'Tipos de Personal',
        value: profileStats.profilesByType.length,
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        color: 'indigo',
        description: 'Categorías de personal'
      }
    ];
  };

  const combinedStats = getCombinedStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Gestión de Usuarios y Perfiles</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, perfiles y códigos QR del sistema ACCESUM</p>
        </div>
      </div>

      {/* Stats Cards */}
      {combinedStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combinedStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-700">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas por tipo de personal */}
      {profileStats && profileStats.profilesByType.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Tipo de Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profileStats.profilesByType.map((type, index) => {
              const total = profileStats.profilesByType.reduce((sum, t) => sum + parseInt(t.count), 0);
              const percentage = total > 0 ? (parseInt(type.count) / total * 100).toFixed(1) : '0';
              
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{type.count}</div>
                  <div className="text-sm text-gray-600 capitalize">{type.typeName}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User List */}
      <UserList
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
        onCreateUser={handleCreateUser}
        refreshTrigger={refreshTrigger}
        showViewAction={true} // Nueva prop para mostrar botón "Ver"
      />

      {/* Modal para Formulario */}
      {(selectedUser || showCreateForm) && activeView === 'form' && (
        <UserForm
          user={selectedUser}
          onSave={handleUserSaved}
          onCancel={handleCloseModal}
        />
      )}

      {/* Modal para Vista Detallada */}
      {viewingUser && activeView === 'detail' && (
        <UserView
          user={viewingUser}
          onClose={handleCloseModal}
          onEdit={() => handleEditUser(viewingUser)}
          onUpdate={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserManagement;