// frontend/src/pages/UserManagement.tsx - Con estadísticas de fichas
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* ⭐ ESTADÍSTICAS DE APRENDICES POR FICHA */}
      {userStats && userStats.learnersByFicha && userStats.learnersByFicha.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🎓 Aprendices por Ficha</h3>
            <span className="text-sm text-gray-500">
              {userStats.learnersByFicha.length} fichas activas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.learnersByFicha.map((ficha, index) => {
              const totalAprendices = userStats.learnersByFicha?.reduce((sum, f) => sum + parseInt(f.count), 0) || 0;
              const percentage = totalAprendices > 0 ? (parseInt(ficha.count) / totalAprendices * 100).toFixed(1) : '0';
              
              return (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-green-900 text-sm">
                      📋 {ficha.fichaCode}
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {ficha.count}
                    </div>
                  </div>
                  <div className="text-xs text-green-700 mb-2" title={ficha.fichaName}>
                    {ficha.fichaName.length > 40 
                      ? `${ficha.fichaName.substring(0, 40)}...` 
                      : ficha.fichaName}
                  </div>
                  <div className="flex justify-between text-xs text-green-600">
                    <span>{percentage}% del total</span>
                    <span>Aprendices</span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="mt-2 w-full bg-green-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estadísticas por tipo de personal */}
      {profileStats && profileStats.profilesByType.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Distribución por Tipo de Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {profileStats.profilesByType.map((type, index) => {
              const total = profileStats.profilesByType.reduce((sum, t) => sum + parseInt(t.count), 0);
              const percentage = total > 0 ? (parseInt(type.count) / total * 100).toFixed(1) : '0';
              
              // Colores por tipo
              const getTypeColor = (typeName: string) => {
                switch (typeName.toLowerCase()) {
                  case 'aprendiz': return 'bg-green-100 text-green-800 border-green-200';
                  case 'instructor': return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'funcionario': return 'bg-purple-100 text-purple-800 border-purple-200';
                  case 'contratista': return 'bg-orange-100 text-orange-800 border-orange-200';
                  case 'visitante': return 'bg-gray-100 text-gray-800 border-gray-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              return (
                <div key={index} className={`rounded-lg p-4 border ${getTypeColor(type.typeName)}`}>
                  <div className="text-2xl font-bold mb-1">{type.count}</div>
                  <div className="text-sm font-medium capitalize mb-1">{type.typeName}s</div>
                  <div className="text-xs opacity-75">{percentage}%</div>
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
        showViewAction={true}
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