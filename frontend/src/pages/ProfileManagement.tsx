// frontend/src/pages/ProfileManagement.tsx
import { useState, useEffect } from 'react';
import ProfileList from '../components/profiles/ProfileList';
import ProfileView from '../components/profiles/ProfileView';
import { profileService } from '../services/profileService';
import type { Profile, ProfileStats } from '../services/profileService';

const ProfileManagement = () => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const statsData = await profileService.getProfileStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setViewingProfile(profile);
  };

  const handleViewProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setViewingProfile(profile);
  };

  const handleCloseView = () => {
    setSelectedProfile(null);
    setViewingProfile(null);
  };

  const handleProfileUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Gestión de Perfiles</h1>
          <p className="text-gray-600 mt-1">Administra los perfiles y códigos QR del sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Total Perfiles</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.totalProfiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Con Código QR</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.profilesWithQR}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Sin Código QR</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.profilesWithoutQR}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Tipos de Personal</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.profilesByType.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile List */}
      <ProfileList
        onEditProfile={handleEditProfile}
        onViewProfile={handleViewProfile}
        refreshTrigger={refreshTrigger}
      />

      {/* Profile View/Edit Modal */}
      {viewingProfile && (
        <ProfileView
          profile={viewingProfile}
          onClose={handleCloseView}
          onUpdate={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default ProfileManagement;