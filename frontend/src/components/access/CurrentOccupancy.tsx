// frontend/src/components/access/CurrentOccupancy.tsx
import { useState, useEffect } from 'react';
import { accessService } from '../../services/accessService';
import type { CurrentOccupancy } from '../../services/accessService';

interface CurrentOccupancyProps {
  refreshTrigger: number;
}

const CurrentOccupancyComponent = ({ refreshTrigger }: CurrentOccupancyProps) => {
  const [occupancy, setOccupancy] = useState<CurrentOccupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOccupancy();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchOccupancy, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchOccupancy = async () => {
    try {
      const data = await accessService.getCurrentOccupancy();
      setOccupancy(data);
    } catch (error) {
      console.error('Error al cargar ocupación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (record: any) => {
    if (!confirm(`¿Registrar salida de ${record.user.profile.firstName} ${record.user.profile.lastName}?`)) {
      return;
    }

    try {
      await accessService.checkOut({ profileId: record.user.profile.id });
      fetchOccupancy();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al registrar salida');
    }
  };

  const filteredRecords = occupancy?.records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.user.profile.firstName.toLowerCase().includes(searchLower) ||
      record.user.profile.lastName.toLowerCase().includes(searchLower) ||
      record.user.profile.documentNumber.includes(searchTerm)
    );
  }) || [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Personas en las Instalaciones</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {occupancy?.total || 0} personas
            </p>
          </div>
          <button
            onClick={fetchOccupancy}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Actualizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Resumen por tipo */}
        {occupancy && Object.keys(occupancy.byType).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(occupancy.byType).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{type}</p>
                <p className="text-xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Búsqueda */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o documento..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
        />
      </div>

      {/* Lista de personas */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div key={record.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {record.user.profile.profileImage ? (
                    <img
                      src={record.user.profile.profileImage}
                      alt="Foto"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                      {record.user.profile.firstName.charAt(0)}
                      {record.user.profile.lastName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {record.user.profile.firstName} {record.user.profile.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.user.profile.type} - {record.user.profile.documentNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Entrada: {new Date(record.entryTime).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleCheckOut(record)}
                    className="mt-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Registrar Salida
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : 'No hay personas en las instalaciones'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentOccupancyComponent;