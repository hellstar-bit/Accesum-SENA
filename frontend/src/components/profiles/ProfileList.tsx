// frontend/src/components/profiles/ProfileList.tsx
import { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService';
import type { Profile, ProfilesResponse } from '../../services/profileService';

interface ProfileListProps {
  onEditProfile: (profile: Profile) => void;
  onViewProfile: (profile: Profile) => void;
  refreshTrigger: number;
}

const ProfileList = ({ onEditProfile, onViewProfile, refreshTrigger }: ProfileListProps) => {
  const [profiles, setProfiles] = useState<ProfilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, [currentPage, refreshTrigger]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfiles(currentPage, 10, searchTerm);
      setProfiles(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProfiles();
  };

  const handleRegenerateQR = async (profile: Profile) => {
    if (!confirm(`¿Regenerar código QR para ${profile.firstName} ${profile.lastName}?`)) {
      return;
    }

    try {
      await profileService.regenerateQR(profile.id);
      await fetchProfiles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al regenerar código QR');
    }
  };

  if (loading && !profiles) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
        <span className="ml-2">Cargando perfiles...</span>
      </div>
    );
  }

  if (error && !profiles) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchProfiles} className="mt-2 btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header con búsqueda */}
      <div className="px-6 py-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de Perfiles ({profiles?.total || 0})
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
            />
            <button type="submit" className="btn-primary">
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Regional/Centro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                QR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles?.data.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                      {profile.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt={`${profile.firstName} ${profile.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                          {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {profile.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {profile.documentType} {profile.documentNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {profile.type.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{profile.regional.name}</div>
                    <div className="text-gray-500">{profile.center.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {profile.qrCode ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Generado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewProfile(profile)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onEditProfile(profile)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Editar
                    </button>
                    {!profile.qrCode && (
                      <button
                        onClick={() => handleRegenerateQR(profile)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Generar QR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {profiles && profiles.totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((profiles.page - 1) * profiles.limit) + 1} a {Math.min(profiles.page * profiles.limit, profiles.total)} de {profiles.total} perfiles
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
              Página {currentPage} de {profiles.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, profiles.totalPages))}
              disabled={currentPage === profiles.totalPages}
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

export default ProfileList;