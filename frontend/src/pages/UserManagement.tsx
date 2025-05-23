// src/pages/UserManagement.tsx
import { useState, useEffect } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import { userService } from '../services/userService';
import type { User, UserStats } from '../services/userService';

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowCreateForm(false);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setSelectedUser(null);
    setShowCreateForm(false);
  };

  const handleUserSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios del sistema ACCESUM</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Usuarios Inactivos</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.inactiveUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <UserList
        onEditUser={handleEditUser}
        onCreateUser={handleCreateUser}
        refreshTrigger={refreshTrigger}
      />

      {/* User Form Modal */}
      {(selectedUser || showCreateForm) && (
        <UserForm
          user={selectedUser}
          onSave={handleUserSaved}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default UserManagement;